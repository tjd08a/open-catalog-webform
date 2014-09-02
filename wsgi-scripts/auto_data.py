# James Tobat
# Last Updated: 7/16/14
# Description: Script that provides data
# to generate website.
import json
import sys
import glob
import subprocess, shlex
from collections import OrderedDict

# These paths will need to change depending on server paths
home_dir = "/home/ubuntu/" # Home directory
data_dir = home_dir+"workspace/web_catalog/open-catalog-generator/" # Open Catalog Generator Location
catalog = data_dir + "darpa_open_catalog/" # Open Catalog Location
wsgi_dir = "/usr/local/www/wsgi-scripts/" # Location of wsgi scripts on server
program_path = catalog + "active_content.json" # Location of active program names
script_path = data_dir + "scripts" # Location of scripts in Open Catalog
schemas_path = catalog + "00-schema-examples.json" # Schema Template File
config_file = wsgi_dir + "config.json" # Configuration File
help_file = wsgi_dir + "help.json" # Help Menu File


# json_record is a json object where its values associated
# with fields/keys from the field_list are going to be added
# to the term_list if the value isn't already present.
# A new term_list is returned with values in it that
# weren't present before.
def findTerms(json_record, field_list, term_list):
  for field in field_list:
    if field in json_record:
        if isinstance(json_record[field], list):
          for term in json_record[field]:
            if not term in term_list[field] and term != "":
              term_list[field].append(term)
        else:
          term = json_record[field]
          if not term in term_list[field] and term !="":
            term_list[field].append(term)
  return term_list

# Return array of DARPA program names.
# The path is the location of the active
# program names which is the file 
# active_content.json when this was written.
def getProgramNames (path):
  nameList = [] # Will store the program names
  json_content = openJSON(path)
  for record in json_content:
    nameList.append(record['Program Name'])
  return nameList

# This will retrieve a list of unique entries
# present in the Open Catalog of each field name
# given in the fieldList input. The schemaList
# is the input that is loaded from the schema
# template file 00-schema-examples.json. 
# Essentially it provides a list of all the
# schemas in the Open Catalog which includes
# their type name and the schema itself.
# This will return an object where each key
# is an item in the fieldList and the value
# is a list of unique entries for the given
# field.
def retrieveFieldNames(fieldList, schemaList):
  openPubs = False # If true, Publication json
                   # files will be searched
  openPrograms = False # If true, Program json
                       # files will be searched
  openSoftware = False # If true, Software json
                       # files will be searched

  term_list = {} # Object where keys are fields in
                 # fieldList and values are arrays 
                 # with unique terms for the field.
  for field in fieldList:
    term_list[field] = []
    for schema in schemaList:
      # Checks to see what types of files
      # need to be opened to search for
      # the field entries.
      if field in schema['Schema'][0]:
        if schema['Type'] == "Program":
          openPrograms = True
        elif schema['Type'] == "Publication":
          openPubs = True
        else:
          openSoftware = True

  search_files = [] # List of files to search
  if openPrograms:
    search_path = catalog + "/*-program.json"
    search_files.extend(glob.glob(search_path))
    
  if openPubs:
    search_path = catalog + "/*-pubs.json"
    search_files.extend(glob.glob(search_path))

  if openSoftware:
    search_path = catalog + "/*-software.json"
    search_files.extend(glob.glob(search_path))

  for doc in search_files:
    json_data = openJSON(doc)

    # Checks to see if the JSON object loaded is a list.
    # If it is a list, checks each records for unique
    # terms otherwise checks the singular object.
    if isinstance(json_data, list):
      for record in json_data:
        term_list = findTerms(record, fieldList, term_list)
    else:
      term_list = findTerms(json_data, fieldList, term_list)

  return term_list

# Returns a JSON object that was loaded from the file given
# in the file path.
def openJSON(file_path):
  json_file = open(file_path, 'r')
  try:
    # Loads the JSON object but preserves the order of attributes
    json_content = json.load(json_file, object_pairs_hook=OrderedDict)
  except Exception, e:
    print "\nFAILED! JSON error in file %s" % file_path
    print " Details: %s" % str(e)
    sys.exit(1)

  return json_content

# Determines what schemas that a user should be given.
# The schemaList is the list that was returned from
# the 00-schema-examples.json file. The userList
# is a list of the restricted users i.e. the users
# who are given access to all schemas. The user
# is the name of the user that is requesting from
# the server. If the user's name in the list, the entire
# schemaList will be returned, but if not, the Program
# schema will be left out.
def restrictSchemas( schemaList, userList, user ):
   if user in userList:
     return schemaList
   else:
     for i in xrange(len(schemaList)):
       if schemaList[i]['Type'] == "Program":
         schemaList.pop(i)
         break

   return schemaList

# Server response to client requests
def application(environ, start_response):
   command = "cd %s" % wsgi_dir
   command += "; ./update_catalog %s" % data_dir
   # Updates the open catalog so all the data obtained is current.
   subprocess.Popen(shlex.split(command), stdout=subprocess.PIPE, shell=True)
   server_response = {}
   request_body = environ['wsgi.input'].read() # Reads input from client
   user = json.loads(request_body) # User name from client
   config = openJSON(config_file);
   help_menu = openJSON(help_file);
   name = "%s %s" % (user['First'], user['Last'])
   status = '200 OK'
   response_headers = [('Content-type', 'application/json')]
   start_response(status, response_headers)
   server_response['Schemas'] = restrictSchemas(openJSON(schemas_path), config['Program Managers'], name)
   server_response['Program_Names'] = getProgramNames(program_path)
   server_response['Auto_Data'] = retrieveFieldNames(config['Autocomplete'], server_response['Schemas'])
   server_response['Help_Menu'] = help_menu
   server_response['Required'] = config['Required'] # List of required fields, they must be non-blank.
   json_response = json.dumps(server_response)

   return [json_response]
