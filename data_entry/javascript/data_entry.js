// An object that will eventually be submitted to the server.
// Will contain keys that are the names of the different schema types,
// and the corresponding value is a list that contains schema copies
// with user entered values.
var schemaList = {};
// An object where each key is the name or type of each schema, where
// the value is a list of field names in the schema that need to have
// non-blank values.
var required = {};

// Sets a document cookie. Uses the given name, value, and
// will set it to expire in the number of days given.
function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  var expires = "expires="+d.toGMTString();
  document.cookie = cname + "=" + cvalue + "; " + expires +
  "; path=/";
}

// Gets the current value of a cookie with the given name.
// Returns "" if no value has been set for it.
function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for(var i=0; i<ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0)==' ') c = c.substring(1);
    if (c.indexOf(name) != -1) return c.substring(name.length,c.length);
  }
    return "";
}

// Runs the code below once the document loads.
$( function() {
  $( "#nameMenu" ).hide();
  // Checks to see if a name has been set, and if not, 
  // creates a dialog that will obtain the user's
  // first and last name. This will be tested to 
  // ensure that they are in fact names.
  if( getCookie( "lname" ) == '') {
    $( "#nameMenu" ).dialog({
      resizable: false,
      modal: true,
      width: 390,
      height: 220,
      buttons: {
      "Enter": function() {
        var fname = $( '#fname' ).val();
        var lname = $( '#lname' ).val();
        if (fname == '' || lname == '') {
          alert('Please supply a first and last name.')
        }
        else {
          // Tests to see if both the last and first
          // name are actual names (A-Z or ' or - present)
          var pattern = /^[a-zA-Z'-]+$/;
          if( pattern.test(lname) && pattern.test(fname) ) {
            setCookie('lname', lname, 30);
            setCookie('fname', fname, 30);
            $( this ).dialog( "close" );
            location.reload();
          }
          else {
            alert("Only use A-Z or a-z or ' or - in the names");
          }    
        }
      }

      }
    });  
  } 
  
  // The html div sections below are meant to be hidden
  $( "#error" ).hide(); // This div only appears after a validation error occurs
  // The button hides menu text, this is not meant to appear on the main page
  $( "#submitTxt" ).hide();
  $( "#addMenu" ).hide();

  // Gets the set name of the user, will only send a request to the server
  // for page information if both the first and last name have been set.
  var user = {};
  user['First'] = getCookie('fname');
  user['Last'] = getCookie('lname');
  var json_post = JSON.stringify(user);
  
  // Will only request information from the server
  // if the user has entered a non-blank name.
  if (user['First'] != ''){
    $.ajax({
      type:'POST',
      url:'/wsgi-scripts/auto_data.py',
      data:json_post,
      // Creates the web page if and only 
      // if data has been recieved from
      // the server successfully.
      success: function( data ) {
        createPage( data );
      }
    });
  }

  // Clears the values of a tab on the page.
  // Will essentially clear every textarea and
  // will reset any group of checkboxes by checking
  // all of them.
  function clearTab(schemaType){
    var selector = 'textarea.' + schemaType;
    // Clears the textareas
    $( selector ).each( function () {
      $(this).val('');
    });
    
    selector = 'input.' + schemaType +
    '[type="checkbox"]';
    // Resets groups of checkboxes by checking
    // all the values in the group.
    $( selector ).each( function() {
      this.checked = true;
    });
  }

  // Takes the values entered on the form/tab, converts
  // it into a JSON format. This is done so a text preview
  // of the entry can be shown before it is stored on the
  // server. The JSON preview will be shown when the Add
  // button is pressed.
  function addButtonMenu( schemaCopy ) {
    var jsonText = JSON.stringify(schemaCopy, undefined, 2);
    $( '#addMenuText' ).html(jsonText);
  }

  // Scrolls to an element with the given ID,
  // doing so using an animation.
  function scrollTo( elementID ) {
    var selector = "#" + elementID;
    $('html, body').animate({
      scrollTop: $(selector).offset().top
    }, 500);
  }

  // Validates a form grabbed from a textarea on the page.
  // Multiple is true or false, this indicates that the
  // value expects multiple inputs or not.
  // Attribute is the value from the page, this particular
  // page only validates textareas as that is the only
  // input type it contains.
  // Location is the name of the field on the form or tab that
  // is being evaluated.
  // Type is the schema or tab name which is being evaluated.
  // Both the location and type are collected for validation
  // and error reporting purposes.
  function validate( multiple, attribute, location, type) {
    try {
      var validAttr = attribute.trim(); // Removes unnecessary whitespace

      // If the input is blank, checks to see if the field requires an
      // input and if it doesn't, returns an empty string or array depending
      // on if multiple inputs are expected or not. If the field is required,
      // an error is thrown.
      if (validAttr == "") {
        if ( type in required && required[type].indexOf(location) > -1 ) {
          throw "This field is required.";
        }

        // Attributes that require multiple inputs are assigned an empty
        // array, so that it is displayed as a list in the JSON file.
        if ( multiple ) {
            validAttr = [''];
        }

        // Returns the blank attribute and ends the validation
        // so it doesn't get further processed.
        return validAttr;
      }

      // If the field being validated is "New Date" or "Update Date" 
      // and the field contains a non-blank value, it will evaluate
      // the date. Checks to make sure that the date is in the format
      // yyyymmdd.
      if ( location == "New Date" || location == "Update Date" ) {
        var pattern = /^[0-9]{4}[0-1][0-9][0-3][0-9]$/;
        if ( !pattern.test(validAttr) ) {
          throw "Not a valid date format, use yyyymmdd."
        }
      }
      
      // If the field is supposed to contain multiple values,
      // it will split the field's text into separate values
      // and add each to a list.
      if ( multiple ) {
        // Splits text based on newlines, accounts for OS differences.
        var valueList = validAttr.split(/\r\n|\n|\r/);
        var finalList = [];     
        for( var i = 0; i < valueList.length; i++ ) {
          var value = valueList[i];
          value = value.trim(); // Removes unnecessary whitespace
        
          // Ignores blank values in a list
          if (value != "") {
            finalList.push(value); 
          }    
  
        }  
        // Assigns the value to be stored in JSON as
        // the list with blank values ignored, and 
        // unnecessary whitespace removed.
        validAttr = finalList; 
      }
    }   
    // Error handler
    catch(err) {
      addError( err, location ); // Adds error text to html page
      $( '#error').show(); // Shows the error div on the html page
      scrollTo('error'); // Scrolls to the error div with an animation
      return false;
    }
     
    return validAttr;
  }

  // Returns a JSON schema with blank values. 
  // This means Array values will be turned into
  // empty arrays and 
  function blankSchema( schema ) {
    var schemaCopy = {};
    for (var attribute in schema) {
      // Schema attributes with a list
      // i.e. expects multiple inputs, will
      // have its value replaced by an empty array.
      if( schema[attribute] instanceof Array ) {
        schemaCopy[attribute] = [];
      }
      else {
        schemaCopy[attribute] = "";
      }
    }
    return schemaCopy
  }

  // Splits a given text value using
  // newline and space terms.
  function split( val ) {
    return val.split( /\n\s*/ );
  }
  
  // Extracts the last term from a text
  // value that was split using the above function
  function extractLast( term ) {
    return split( term ).pop();
  }
    
  // Adds error text to the special div
  // on the page. The error input is the
  // text that describes the error. The location
  // is the field/row (e.g. Program Teams) where 
  // the error occured.
  function addError( error, location ) {
    var errorText = '<li>Error in "' + location +
    '": ' + error + '</li>';
    $( '#errorList' ).append( errorText );
  }
  
  // Adds checkbox html elements for a list of checkbox values.
  // The schemaType is the class that it will be assigned. 
  // The dataLabel is the name of the group that the checkboxes
  // belong to.
  function addCheckBoxes ( checkBoxes, schemaType, dataLabel ) {
    var html = "";
    // For each value in the checkBoxes array, it will
    // create a checkbox input with its name/group being
    // dataLabel, its class being the schemaType, and 
    // leaving it checked as default.
    for ( var i = 0; i < checkBoxes.length; i++ ) {
      selectValue = checkBoxes[i];
      html += '<li class="ui-state-default">';
      html += '<input type="checkbox" name="' + dataLabel +
      '" value="' + selectValue + '" class="' + schemaType +
      '" checked="checked">' + selectValue + '<br>';
    }

    return html;
  }

  // Adds Help Menu text to the page so it can be
  // displayed in a dialog box. 
  // Type is the schema or tab type that the help button
  // belongs to. 
  // The menuText input is a list of JSON objects
  // where  each object contains the name of the field
  // that the help menu describes, a description of the field,
  // and an example.
  function addMenu ( type, menuText ) {
    var name;
    var desc;
    var example;
    var html;
    for( var i=0; i<menuText.length; i++ ){
      name = menuText[i]['Name'];
      desc = menuText[i]['Description'];
      example = menuText[i]['Example'];
      // Appends text to the body of the page, so that it can 
      // be displayed in a dialog menu.
      html = '<div title="Help" class="help" data-class="' + type + '" data-label="' + name +
      '"><p><b>Name:</b> ' + name + '<br><br><b>Description:</b> ' + desc +
      '<br><br><b>Example:</b> ' + example + '<br><br>' + 
      'To enter multiple values, press the Enter key.</p></div>';
      $( 'body' ).append(html);
    }

  }

  // Creates the table present in each tab or schema type on the page.
  // This includes input boxes (checkboxes or textareas) for each
  // field as well as adding help buttons for every row. The last row
  // of every table also contains an Add and Submit button.
  // The schema is the list of keys and values that will be used to 
  // populate the table.
  // The schemaType is the name of the schema being passed through.
  // pubsColumns is a list of values for the field "Display Pubs Columns",
  // this input is irrelevant if the field is not present in the schema.
  // softwareColumns is a list of values for the field "Display Software Columns",
  // this input is irrelevant if the field is not present in the schema.
  // autoData is a list of fields that will have the auto-complete feature added to 
  // them, this list is present to ensure the table columns have the correct
  // classes assigned.
  function createTable ( schema, schemaType, pubColumns, softwareColumns, autoData ) {
    var id = schemaType + "t";
    var table = '<table id="' + id +
    '"><tr><th>Name</th><th>Value</th></tr>';
    var tabSelector = "#" + schemaType;

    // Adds row to the table for every attribute present in the schema.
    // It wil either be a textarea or a set of checkboxes depending
    // on the key name.
    for (var key in schema) {
      var tableRow = '<tr><td>' + key + ':</td><td>'; // The label for the input

      // Decides between adding checkboxes or a textarea, only two keys currently will generate checkboxes.
      if ( key == "Display Pubs Columns" || 
           key == "Display Software Columns" ) {
        
        tableRow += '<div class="checkBox"><ul class="sortable">'; // Ensures that the checkboxes
                                                                   // can be arranged.
        // Adds checkboxes based on the data from either the pubsColumns or
        // softwareColumns array.
        if ( key == "Display Pubs Columns" ) {     
          tableRow += addCheckBoxes( pubColumns, schemaType, key );       
        }
        else {
          tableRow += addCheckBoxes( softwareColumns, schemaType, key );  
        }
        
        tableRow += '</ul></div>';
      }
      else {
        tableRow += '<textarea wrap="soft" class="';
        
        // Checks if the attribute in the schema is a list or not,
        // and adds the appropriate class so it can be properly
        // dealt with later.
        if ( schema[key] instanceof Array ) {
          tableRow += 'multiple';
        }
        else{
          tableRow += 'single';
        }

        tableRow += " " + schemaType;
        // Adds an autoComplete class if the input
        // will have the auto-complete feature added
        // to it. This is done to ensure that the feature
        // can be added appropriately.
        if ( autoData.indexOf(key) >= 0 ){
          tableRow +=' autoComplete"';
        }
        else{
          tableRow +='"';
        }
        tableRow += ' data-label="' + key +
        '">' + '</textarea>';
      }
      
      // Adds a help button to the end of every input row
      tableRow += '</td><td><button class="helpBtn notLast" data-label="' + key 
      + '" data-class="'+ schemaType + '">Help</button>' + '</td></tr>';
      table += tableRow;
    }

    // Below is the html for the Add/Submit buttons that are at the end
    // of every table.
    var submitBtns = '<tr><td></td><td class="lastRow">' +
    '<button class="append" schema="'+ schemaType +'">Add</button>' +
    '<button class="submit">Submit</button></td>' +
    '<td><button class="helpBtn lastHelp"' +
    '>Help</button></td></tr></table>';
    table += submitBtns;

    // Adds the generated table to the web page.
    $( tabSelector ).append( table);

    // Ensures that the help buttons as well as the
    // Add and Submit buttons have the proper icons, formatting,
    // and appropriate dialog menu.
    $( ".helpBtn" ).button({
      icons: {
        primary: "ui-icon-help"
        },
      text: false
     });

    $( ".help" ).dialog({
      autoOpen: false,
      modal: true,
      height: 500,
      width: 500 
    });

    $( ".notLast" ).click( function() {
      // Finds the appropriate menu dialog
      // for the schema input pops up.
      var type = $( this ).attr("data-class");
      var label = $( this ).attr("data-label");
      var selector = '.help[data-label="' + label + '"]' +
      '[data-class="' + type + '"]';
      $( selector ).dialog();
    });

    $( ".append" ).button({
      icons: {
        primary: "ui-icon-plusthick"
        }
     });

    $( ".submit" ).button({
      icons: {
        primary: "ui-icon-play"
        }
     });
    
    $( ".lastHelp" ).click( function() {
      $( "#submitTxt" ).dialog();
    });

    return
  }

  // Generates the web page given the schemas, and configuration from the
  // server. pageData is the server response to the post request made
  // near the top of this script. To see details of the server response,
  // please see the auto_data.py script.
  function createPage ( pageData ) {
    var schemaObject = {}; // Meant to store a single instance of a JSON schema
    var schemas = pageData['Schemas']; // List of schemas from server
    // The two variables below store data for two keys that will be used
    // to generate checkboxes, these are special cases as all other schema
    // input types generate textareas.
    var pubsColumns = pageData['Auto_Data']['Display Pubs Columns'];                                                         
    var softwareColumns = pageData['Auto_Data']['Display Software Columns'];
    var autoData = []; // Stores all keys of fields that will have autocomplete

    // Creates a list of all fields that will
    // use auto-complete.
    for( var key in pageData['Auto_Data'] ) {
      autoData.push(key);
    }

    // Identifies all the required (needs non-blank value) fields
    // for each schema. It then assigns the list of required fields
    // to the required object (defined at the top), where the key 
    // is the schema type.
    for( var i = 0; i < pageData['Required'].length; i++ ) {
        // Assigns the list to the appropriate place in the 
        // required object, where the key is the schema type.
        for( var key in pageData['Required'][i]) {
          required[key] = pageData['Required'][i][key];
          break;
        }
    }

    // For all the schemas returned from the 
    // server, it will create a tab for each 
    // which includes a table and buttons for each
    for ( var i = 0; i < schemas.length; i++ ) {
      var schemaType = schemas[i]['Type']; // A string that identifies the type of
                                           // schema that is currently being used.
      var schemaCopy = schemas[i]['Schema'][0]; // An instance of the schema type
      schemaList[schemaType] = []; // Creates an empty list to hold copies of the
                                   // schema with user entered values.

      // Creates the tab for the schema.
      var html = '<li><a href="#' + schemaType + '">' +
      schemaType + '</a></li>';

      $( '#schemaLinks' ).append( html );
      html = '<div id="' + schemaType + '">' + '</div>';
      $( '#tabs' ).append(html);
      schemaObject[schemaType] = blankSchema(schemaCopy);
      // A table with the buttons and appropriate input fields is created
      createTable( schemaCopy, schemaType, pubsColumns, softwareColumns, autoData );
    }

    // Creates the help menu text for every schema and field present in the 
    // config.json file (edit this to change the help menu text or add new
    // help menus).
    for( var i = 0; i < pageData['Help_Menu'].length; i++) {
      var currentMenu = pageData['Help_Menu'][i]
      // Checks to see if the schema type is "all"
      // and it is, the menu text provided is for the
      // Add/Submit buttons which is treated seperately.
      // Otherwise, it will add help menus for all schema types
      // and fields in those schemas provided in the config file.
      if(currentMenu['Schema'] == "All") {
        var menu = {};
        menu = currentMenu['Menu'];
        var desc = menu['Description'];
        var name = menu['Name'];
        var html = '<div id="submitTxt" title="Help" class="help">' + 
        '<p><b>Name:</b> ' + name + '<br><br><b>Description:</b> ' + 
        desc + '</p></div>';
        $( 'body' ).append(html);
      }
      else {
        addMenu(currentMenu['Schema'], currentMenu['Menu']);
      }
    }

    // Ensures that when selecting a value from
    // the auto-complete list of values, the
    // input will resize.
    $( ".autoComplete.single" )
    .autocomplete({
      minLength: 1,
      select: function( event, ui ) {
        this.value = ui.item.value;
        $(this).trigger('autosize.resize');
      }
    });

    // When selecting values from an auto-complete
    // box and the input field expects multiple-values,
    // this will ensure that new values will be appended to
    // the input list via a newline character, and the input
    // box will be resized.
    $( ".autoComplete.multiple" )
      .bind( "keydown", function( event ) {
        if ( event.keyCode === $.ui.keyCode.TAB &&
          $( this ).autocomplete( "instance" ).menu.active ) {
            event.preventDefault();
          }
        })
      .autocomplete({
        minLength: 1,
        focus: function() {
          // prevent value inserted on focus
          return false;
        },
        select: function( event, ui ) {
          var terms = split( this.value );
          // remove the current input
          terms.pop();
          // add the selected item
          terms.push( ui.item.value );
          // add placeholder to get the comma-and-space at the end
          terms.push( "" );
          this.value = terms.join( "\n" );
          $(this).trigger('autosize.resize');
          return false;
        }
      });

    // Binds the source of the auto-complete data
    // to the appropriate input box.
    $.each( $(".autoComplete.multiple"), function() {
      var data_label = $( this ).attr( 'data-label' );
      var source = pageData['Auto_Data'][data_label];
      $( this )
        .autocomplete({ 
          source: function( request, response ) {
            // delegate back to autocomplete, but extract the last term
            response( $.ui.autocomplete.filter(
              source, extractLast( request.term ) ) );
          }
        });
    });
    
    // Binds the source of the auto-complete data
    // to the appropriate input box.
    $.each( $(".autoComplete.single"), function() {
      var data_label = $( this ).attr( 'data-label' );
      $( this )
        .autocomplete({
          source: pageData['Auto_Data'][data_label]
        });
    });
    
    // Binds the auto-complete data for the DARPA Program
    // names to the appropriate fields.
    $.each( $( "textarea[data-label='DARPA Program Name'],\
    textarea[data-label='DARPA Program']" ), function( event, ui ) {
      $( this )
        .autocomplete({
          source: pageData['Program_Names']
        });
    });
    
    // Enables the checkboxes to be rearranged
    $( '.sortable' ).sortable();
    $( '.sortable' ).disableSelection();
    // Creates the tab effect on the page
    $( '#tabs' ).tabs();
    // Enables automatic resizing of the
    // textareas on the page.
    $( 'textarea' ).autosize();  
    
    // Handles the submission of data on the page
    $( '.submit' ).click( function () {
      var serverSubmit = {}; // The object that will eventually be passed
                             // to the server.
      serverSubmit['Entries'] = schemaList; // User data
      serverSubmit['User'] = getCookie('fname') + '_' + getCookie('lname'); // User ID
      // Data transformed into a version 
      // that can be passed to the server.
      var submission = JSON.stringify(serverSubmit); 
      // Replaces the html code for the "<" and ">" symbols with those
      // symbols. This was done to ensure no executable script
      // could be entered on the page itself. The data would
      // need to be checked server side for html as well. 
      submission = submission.replace(/&lt/g,'<').replace(/&gt/g,'>');
      // Creates a confirmation menu for the Submit button, where
      // clicking confirm sends the data to the server, while
      // cancel sends them back to the page without doing anything.
      $( "#submitMenu" ).dialog({
          resizable: false,
          modal: true,
          width: 300,
          height: 200,
          buttons: {
            "Confirm": function() {
              $( this ).dialog( "close" );
              $.ajax({
                type:'POST',
                url:'/wsgi-scripts/store_json.py',
                data:submission,
                success: function( data ) {
                  alert("Submit was successful.");
                }
              });
            },
            Cancel: function() {
              $( this ).dialog( "close" );
            }
          }
      });

    });

    // Handles the addition of new user input
    $( '.append' ).click( function () {
      // Obtains the type of schema where the add
      // button was clicked
      var schemaType = $( this ).attr('schema');
      var selector = 'textarea' + '.' + schemaType;
      // Obtains a copy of the schema with the obtained
      // schemaType.
      var schemaCopy = blankSchema(schemaObject[schemaType]);
      var badData = false; // This is true if there was
                           // an error in validation.
      $( '#errorList').empty(); // Clears the error div
      // Goes to each input on the tab
      $( selector ).each( function() {
        var dataLabel = $( this ).attr( 'data-label' ); // field name
        var multiple; // true if multiple inputs expected
        // Swaps the symbols "<" and ">" for their equivalent html
        // codes. This is done to prevent script from being entered
        // in and executed by the user.
        $(this).val( function(i, v) {
          return v.replace(/</g,'&lt').replace(/>/g,'&gt');
        });
        var attribute = $(this).val();
        if ( $( this ).hasClass('multiple') ) {
          multiple = true;
        }
        else {
          multiple = false;
        }
        
        // Validates the input and then assigns it to the appropriate
        // place in the schema if it doesn't have errors.
        attribute = validate(multiple, attribute, dataLabel, schemaType);
        if( attribute !== false ) {
          schemaCopy[dataLabel] = attribute;  
        }
        else {
          badData = true;
        }
      }); 
      
      // If the data isn't bad, the error div will be emptied
      // and all of the user entered data will be pushed to 
      // the schemaList(the data that will sent to the server).
      if( !badData ) {
        var selector = '#error';
        $( '#errorList').empty();
        // Gathers the values from the checked checkboxes
        $( ':checked.' + schemaType ).each( function() {
          var dataLabel = $(this).attr('name');
          schemaCopy[dataLabel].push($(this).val());
        });

        // Hides the error div on the page.
        if( $( selector ).is(":visible") ) {
          $( selector ).hide();
        }
        
        addButtonMenu(schemaCopy); // Creates text preview of
                                   // data entry as it will
                                   // appear on the server.
        $( "#addMenu" ).dialog({
          resizable: false,
          modal: true,
          width: 1000,
          height: 500,
          buttons: {
            "Confirm": function() {
              $( this ).dialog( "close" );
              schemaList[schemaType].push(schemaCopy);
              clearTab(schemaType); // Clears the input boxes.
            },
            Cancel: function() {
              $( this ).dialog( "close" );
            }
          }
      });

        
      }         
    });

  }

});
