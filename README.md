# Introduction
The web application for the Open Catalog is meant to simplify the process of submitting new data for the Catalog.

# Structure
The repo contains all the pieces of the web application. The **data-entry** folder contains the html pages used while
the **javascript** folder inside includes all the external Javascript Script files used. There is a **style** folder inside of the **javascript**
folder which contains the stylesheets used and all **JQuery UI** external scripts. There is also a **wsgi-scripts** folder which contain all of the server side
scripts used, they are written in Python. The folder also contains configuration files for the application which are in JSON format.

# Dependencies
The web application relies on two Javascript libararies and they are:  
* **JQuery - 2.1.1** - http://jquery.com/
* **JQuery UI - 1.11.0** - http://jqueryui.com/
* **JQuery Autosize** - http://www.jacklmoore.com/autosize/

# Additional Help
* See https://github.com/tjd08a/wsgi_boilerplate for additional details on how to
configure a web server to run WSGI.
* See https://github.com/ericwhyne/darpa_open_catalog and 
https://github.com/ericwhyne/open-catalog-generator for information about the Open
Catalog.