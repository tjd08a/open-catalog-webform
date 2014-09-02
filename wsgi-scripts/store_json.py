# James Tobat
# Last Updated: 8/22/14
# Description: Script that takes submitted
# data from user and turns them into json files.
import os
import time
import json
import sys
from collections import OrderedDict

# These paths will need to change depending on server paths
home_dir = "/home/ubuntu/" # Home directory
data_dir = home_dir + "workspace/web_catalog/open-catalog-generator/" # Open Catalog Generator Location
wsgi_dir = "/usr/local/www/wsgi-scripts/" # Location of wsgi scripts on server
config_file = wsgi_dir + "config.json" # Configuration File
save_path = "/var/www/html/data_entry/entries/" # Location where folders/json files should be stored

# Creates a .json file with the given path input,
# dumping the data input into the file.
def createJSONFile(path, data):
  try:
    with open(path, 'w') as output:
      json.dump(data, output, sort_keys = False, indent=4, separators=(',',':'), ensure_ascii=False)
  except Exception, e:
    print "\nFAILED! Could not create %s as a json file" % path
    print " Details: %s" % str(e)

  return

# Makes all the json files based on the sortedJSONList.
# Uses the "Storage" config json object, specifically the 
# "Alias" value as this is what is used to name the files.
# The sortedJSON list is a list of json entries that have
# gone through the sortedJSONEntries method. 
# The save_dir is where the json files will be created.
# The user is the fist and last name of the user who
# made the submissions to the server connected by an
# underscore, this can also be used in the naming of files.
def makeJSONFiles(sortedJSONList, config, save_dir, user):
  file_name = ""
  alias = None

  for schema in sortedJSONList: 
    hasAlias = False
    if schema in config:
      if config[schema]['Alias'] != "":
        alias = config[schema]['Alias']
        hasAlias = True
        
    # If no alias or alternative name
    # for the file type is given, the
    # schema type will be used and
    # turned to all lower case.
    if not hasAlias:
      alias = schema.lower()

    entryList = sortedJSONList[schema]
    # Will not create files for empty
    # schema lists.
    if entryList != None:
      for entry in entryList:
        # If no sorting key is used,
        # all json entries will be stored
        # with a file name containing the
        # user name otherwise, it will use
        # the key in the list.
        if entry == "None":
          file_header = user
        else:
          file_header = entry

        currentEntry = entryList[entry]
        # If there is only a single object,
        # it will turn the json to be stored
        # in the file as a single object as well.
        if len(currentEntry) == 1:
          schemaObj = currentEntry[0]
        else:
          schemaObj = currentEntry

        # The alias and file header can be changed by
        # using the config.json file.
        file_name = save_dir + file_header + "-" + alias + ".json"
        createJSONFile(file_name, schemaObj)
      
  return

# Returns a JSON object that was loaded from the file given
# in the file path.
def openJSON(file_path):
  json_file = open(file_path, 'r')
  try:
    json_content = json.load(json_file, object_pairs_hook=OrderedDict)
  except Exception, e:
    print "\nFAILED! JSON error in file %s" % file_path
    print " Details: %s" % str(e)
    sys.exit(1)
  
  return json_content

# Sorts the list of json entries from
# the client, assumes they are in the form
# key = schema type, value = array of json 
# entries to be stored. The config input 
# is in the form of the storage element
# inside the config.json file. The "storage"
# config comes in the form of a key and an alias.
# The "key" element defines what each schema should
# be sorted by. The new json object returned will
# have keys equal to the schema type where the values
# are of this is another object. This object has a
# a set of keys which all the unique instances
# of the key in the schema e.g. all the DARPA
# program names present. The value is a list of
# all the json entries which had this key as one
# of their values.
def sortJSONEntries(jsonList, config):
  storage = OrderedDict()
  for schemaType in jsonList: 
    storeValue = ""
    # Finds the value/key to sort the list of
    # json entries in, if it's in the configuration
    if schemaType in config:
      storeValue = config[schemaType]['Key']
    
    # Does not create an object for schemas
    # that aren't in the list of entries.
    entryList = jsonList[schemaType]
    if len(entryList) == 0:
      storage[schemaType] = None
    else:
      storage[schemaType] = OrderedDict()

    # Identifies the value the key to
    # append entries to
    for entry in entryList:
      if storeValue == "":
        key = "None"
      else:
        key = entry[storeValue]
        if key == "":
          key = "None"
    
      # Creates a list for the key if
      # it doesn't exist
      if not key in storage[schemaType]:
        storage[schemaType][key] = []
        
      storage[schemaType][key].append(entry)
  
  return storage

# Creates directories in the location
# starting first with a directory
# with the pattern yyyy-mm-dd.
# Inside of this directory, will
# be a directory with the userName
# input as its name.
# Returns the directory path regardless
# of creation or not.
def createDir(location, userName):
  currentDate = time.strftime("%Y-%m-%d")
  directory = location + currentDate
  name = "/%s/" % userName
  directory += name
 
  # Creates the directories if they 
  # do not exist.
  if not os.path.exists(directory):
    os.makedirs(directory)

  return directory

# Server response to client requests
def application(environ, start_response):
  request_body = environ['wsgi.input'].read()
  # Loads the json from the client, preserves the order.
  json_entries = json.loads(request_body, object_pairs_hook=OrderedDict)
  directory = createDir(save_path, json_entries['User'])
  config = openJSON(config_file) # Configuration for saving files
  # Sorts the json entries from the client into a new object
  # based on the configuration from config.json.
  storage = sortJSONEntries(json_entries['Entries'], config['Storage'])
  makeJSONFiles(storage, config['Storage'], directory, json_entries['User'])
  status = '200 OK'
  response_headers = [('Content-type', 'text/plain')]
  start_response(status, response_headers)

  return ["OK"]

