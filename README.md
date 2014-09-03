# Introduction
The web application for the Open Catalog is meant to simplify the process of submitting new data for the Catalog.

# Structure
The repo contains all the pieces of the web application. The **data-entry** folder contains the html pages used while
the **javascript** folder inside includes all the external Javascript Script files used. There is a **style** folder inside of the **javascript**
folder which contains the stylesheets used and all **JQuery UI** external scripts. There is also a **wsgi-scripts** folder which contain all of the server side
scripts used, they are written in Python. The folder also contains configuration files for the application which are in JSON format.

# Deployment
In order to deploy the application a few things must happen first:
* A web server must be up and running, and have the ability to run **WSGI** scripts
* The paths on the **WSGI** scripts inside the **wsgi-scripts** folder must be updated
with paths that match the directory structure of the server. The lines that must be changed have a comment above.
* **WSGI** scripts can be stored in any folder on the server, but the Javascript sends requests to the **wsgi** 
folder (/wsgi/) on the root directory. An **Alias** can be used to redirect requests from that folder to the actual
**wsgi** folder used.
* There must already be a copy of the **open-catalog-generator** with the **darpa_open_catalog** inside of it.

# Usage
The web application will first ask for a first and last name, so it can be stored as a cookie. If you have already
entered your name before, this will not happen. A web page will be generated that consists of tabs that match the 
schema types given in the file **00-schema-examples.json** from the **darpa_open_catalog**. Certain schemas will
not be featured in the application if you are not authorized. In each schema tab, you can enter in data for
all of the attributes of that schema. Here are more usage tips:
* To enter multiple values in a single textbox, press the **Enter** key.
* Once you are done entering values, press the **Add** button where you will get a text preview of how your
data will be stored in a file, or you will receive error notifications where you will need to fix the textboxes
identified as having errors.
* Once you are done creating entries, you must press the **Submit** button to send them to the server and have 
them saved.
* If you are confused about an input or even the **Add/Submit** buttons, click the **?** button next to it
to open a help menu.

# Configuration
Aspects of the web application can be configured through the use of the **help.json** and **config.json** files
inside of the **wsgi-scripts** folder. **help.json** is configured by the adding objects with a **Schema** and **Menu**
key. Inside the **Menu** object is a list of help menus. Each help menu object has three keys: **Name**, **Description**, 
and **Example**. To add a new help menu you must do this:
* If the schema you want to create a menu for is not in **help.json**, copy and paste one of the **Schema**/**Menu** objects
in the list and change the name of **Schema's** value.
* For the **Menu** key, add menu objects in a list for every help menu you wish to create. Each menu object contains these keys:
  * **"Name"**: The name of the input field that the help menu will be tied to.
  * **"Description"**: A brief description/overview of the input field. This should explain what type of information should be entered for it.
  * **"Example"**: An example of a proper input for the field.

```
[
    {
        "Schema": "Office",
        "Menu":[
            {
                "Name":"Office Name",
                "Description":"The name of the DARPA office.",
                "Example":"I20"
            }
        ]
    }
]
```

The **config.json** file allows customization of other aspects of the web application. The keys and their values below change the following:
* **"Program Managers"**: A list of users who are allowed to access the **Program** schema for editing. 
  * Append a user's first and last name to this list to give them access to the **Program** schema.
```
"Program Managers":[
        "George Costanza",
        "Jerry Seinfeld"
    ]
```
* **"Autocomplete"**: A list of input fields that have the option of auto-complete.
  * Add an input field to the list to give the option of autocomplete. **Caution**, this typically results in more data being transferred from the server so keep this to a minimum.
```
"Autocomplete":[
        "Program Teams",
        "Categories"
    ]
```
* **"Required"**: A list of objects where each object has a key that is a schema type, and its value is a list of input fields of that schema that must have non-blank values.
  * To add a new schema, copy and paste a **Required** object to the list, change the key to the new schema type.
  * To add new required input fields for a schema, add the input/field name to the list.
```
"Required":[
        {
            "Office":[
                "Office Name",
                "Office Color"
            ]
        }
]
```
* **"Storage"**: An object whose keys are the schema types and their values are another object, with keys **Alias** and **Key**.
This configuration option affects how the server creates and stores the json files. User submmited entries are stored in the form **sort_value-alias.json**. A storage object for a schema contains two
keys, an explanation for each is below:
  * **"Alias"**: Changes the lower half of the file name which is by default, the schema type converted to all lower-case. It will use the **Alias** value in place of the schema type.
  * **"Key"**: Changes the upper half of the file name which is by default, the user name connected via an underscore. This changes how the various user entries are sorted. For instance, using a key of
  "DARPA Program Name" in the "Software" schema would result in all of the user's **Software** entries being grouped by the "DARPA Program Name" where each file has the pattern **"DARPA Program Name"-Alias.json**
```
"Storage":
        {
            "Program":
                {
                    "Alias":"",
                    "Key":"DARPA Program Name"
                },
            "Publication":
                {
                    "Alias":"pubs",
                    "Key":"DARPA Program"
                }
        }
```
  
# Dependencies
The web application relies on two Javascript libararies and they are:  
* **JQuery - 2.1.1** - http://jquery.com/
* **JQuery UI - 1.11.0** - http://jqueryui.com/
* **JQuery Autosize** - http://www.jacklmoore.com/autosize/

# Additional Help
* See https://github.com/tjd08a/wsgi_boilerplate for additional details on how to
configure a web server to run **WSGI**.
* See https://github.com/ericwhyne/darpa_open_catalog and 
https://github.com/ericwhyne/open-catalog-generator for details about the **Open
Catalog**.