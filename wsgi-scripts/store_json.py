import os
import time
import json
import sys
from collections import OrderedDict

home_dir = "/home/jtobat/" # Home directory
data_dir = home_dir + "active/open-catalog-generator/" # Open Catalog Generator Location
wsgi_dir = home_dir + "wsgi/"
config_file = wsgi_dir + "config.json"
save_path = "/var/www/html/data_entry/entries/"

def createJSONFile(path, data):
  try:
    with open(path, 'w') as output:
      json.dump(data, output, sort_keys = False, indent=4, separators=(',',':'), ensure_ascii=False)
  except Exception, e:
    print "\nFAILED! Could not create %s as a json file" % path
    print " Details: %s" % str(e)

  return

def makeJSONFiles(sortedJSONList, config, save_dir, user):
  file_name = ""
  alias = None
  for schema in sortedJSONList: 
    hasAlias = False
    if schema in config:
      if config[schema]['Alias'] != "":
        alias = config[schema]['Alias']
        hasAlias = True
        

    if not hasAlias:
      alias = schema.lower()

    entryList = sortedJSONList[schema]
    if entryList != None:
      for entry in entryList:
        if entry == "None":
          file_header = user
        else:
          file_header = entry

        currentEntry = entryList[entry]
        if len(currentEntry) == 1:
          schemaObj = currentEntry[0]
        else:
          schemaObj = currentEntry

        file_name = save_dir + file_header + "-" + alias + ".json"
        createJSONFile(file_name, schemaObj)
      
  return

def openJSON(file_path):
  json_file = open(file_path, 'r')
  try:
    json_content = json.load(json_file, object_pairs_hook=OrderedDict)
  except Exception, e:
    print "\nFAILED! JSON error in file %s" % file_path
    print " Details: %s" % str(e)
    sys.exit(1)
  
  return json_content

def sortJSONEntries(jsonList, config):
  storage = OrderedDict()
  for schemaType in jsonList: 
    storeValue = ""
    if schemaType in config:
      storeValue = config[schemaType]['Key']
    
    entryList = jsonList[schemaType]
    if len(entryList) == 0:
      storage[schemaType] = None
    else:
      storage[schemaType] = OrderedDict()

    for entry in entryList:
      if storeValue == "":
        key = "None"
      else:
        key = entry[storeValue]
        if key == "":
          key = "None"
    
      if not key in storage[schemaType]:
        storage[schemaType][key] = []
        
      storage[schemaType][key].append(entry)
  
  return storage

  
def createDir(location, userName):
  currentDate = time.strftime("%Y-%m-%d")
  directory = location + currentDate
  name = "/%s/" % userName
  directory += name

  if not os.path.exists(directory):
    os.makedirs(directory)

  return directory

def application(environ, start_response):
  request_body = environ['wsgi.input'].read()
  json_entries = json.loads(request_body, object_pairs_hook=OrderedDict)
  directory = createDir(save_path, json_entries['User'])
  config = openJSON(config_file)
  storage = sortJSONEntries( json_entries['Entries'], config['Storage'])
  makeJSONFiles(storage, config['Storage'], directory, json_entries['User'] )
  status = '200 OK'
  response_headers = [('Content-type', 'text/plain')]
  start_response(status, response_headers)
  return ["OK"]

