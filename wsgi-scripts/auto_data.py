# James Tobat
# Last Updated: 7/16/14
# Description: Script that finds all the unique terms of
# a given JSON attribute that is located in the Open Catalog
import cgi
import json
import sys
import glob
import os
import subprocess, shlex
from collections import OrderedDict

# These paths will need to change depending on server paths
home_dir = "/home/jtobat/" # Home directory
data_dir = home_dir+"test/open-catalog-generator/" # Open Catalog Generator Location
wsgi_dir = home_dir+"wsgi/"
program_path = data_dir + "active_content.json" # Location of active program names
script_path = data_dir + "scripts" # Location of scripts
catalog = data_dir + "darpa_open_catalog" # Open Catalog Location
schemas_path = catalog + "/00-schema-examples.json" # Schema Template File
config_file = wsgi_dir + "config.json" # Configuration File
help_file = wsgi_dir + "help.json" # Help Menu File

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

# Return array of DARPA program names
def getProgramNames (path):
  nameList = []
  json_content = openJSON(path)
  for record in json_content:
    nameList.append(record['Program Name'])
  return nameList

def retrieveFieldNames(fieldList, schemaList):
  openPubs = False
  openPrograms = False
  openSoftware = False
  term_list = {}
  for field in fieldList:
    term_list[field] = []
    for schema in schemaList:
      if field in schema['Schema'][0]:
        if schema['Type'] == "Program":
          openPrograms = True
        elif schema['Type'] == "Publication":
          openPubs = True
        else:
          openSoftware = True

  search_files = []
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

    if isinstance(json_data, list):
      for record in json_data:
        term_list = findTerms(record, fieldList, term_list)
    else:
      term_list = findTerms(json_data, fieldList, term_list)

  return term_list

def openJSON(file_path):
  json_file = open(file_path, 'r')
  try:
    json_content = json.load(json_file, object_pairs_hook=OrderedDict)
  except Exception, e:
    print "\nFAILED! JSON error in file %s" % file_path
    print " Details: %s" % str(e)
    sys.exit(1)

  return json_content

def restrictSchemas( schemaList, userList, user ):
   if user in userList:
     return schemaList
   else:
     for i in xrange(len(schemaList)):
       if schemaList[i]['Type'] == "Program":
         schemaList.pop(i)
         break

   return schemaList

def application(environ, start_response):
   command = "cd %s" % wsgi_dir
   command += "; ./update_catalog %s" % data_dir
   subprocess.Popen(shlex.split(command), stdout=subprocess.PIPE, shell=True)
   server_response = {}
   request_body = environ['wsgi.input'].read()
   user = json.loads(request_body)
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
   server_response['Required'] = config['Required']
   json_response = json.dumps(server_response)

   return [json_response]
