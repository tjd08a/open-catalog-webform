var schemaList = {}; // List of schema entries
var required = {}; // 

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
      html = '<div title="Help" class="help" data-class="' + type + '" data-label="' + name +
      '"><p><b>Name:</b> ' + name + '<br><br><b>Description:</b> ' + desc +
      '<br><br><b>Example:</b> ' + example + '<br><br>' + 
      'To enter multiple values, press the Enter key.</p></div>';
      $( 'body' ).append(html);
    }

  }

  function createTable ( schema, schemaType, pubColumns, softwareColumns, autoData) {
    var id = schemaType + "t";
    var table = '<table id="' + id +
    '"><tr><th>Name</th><th>Value</th></tr>';
    var tabSelector = "#" + schemaType;

    for (var key in schema) {
      var tableRow = '<tr><td>' + key + ':</td><td>';

      if ( key == "Display Pubs Columns" || 
           key == "Display Software Columns" ) {
        
        tableRow += '<div class="checkBox"><ul class="sortable">';
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
        if ( schema[key] instanceof Array ) {
          tableRow += 'multiple';
        }
        else{
          tableRow += 'single';
        }
        tableRow += " " + schemaType;
        if ( autoData.indexOf(key) >= 0 ){
          tableRow +=' autoComplete"';
        }
        else{
          tableRow +='"';
        }
        tableRow += ' data-label="' + key +
        '">' + '</textarea>';
      }
      
      tableRow += '</td><td><button class="helpBtn notLast" data-label="' + key 
      + '" data-class="'+ schemaType + '">Help</button>' + '</td></tr>';
      table += tableRow;
    }

    var submitBtns = '<tr><td></td><td class="lastRow">' +
    '<button class="append" schema="'+ schemaType +'">Add</button>' +
    '<button class="submit">Submit</button></td>' +
    '<td><button class="helpBtn lastHelp"' +
    '>Help</button></td></tr></table>';
    table += submitBtns;

    $( tabSelector ).append( table);

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

  function createPage ( pageData ) {
    var schemaObject = {};
    var schemas = pageData['Schemas'];
    var pubsColumns = pageData['Auto_Data']['Display Pubs Columns'];
    var softwareColumns = pageData['Auto_Data']['Display Software Columns'];
    var autoData = [];

    for( var key in pageData['Auto_Data'] ) {
      autoData.push(key);
    }

    for( var i = 0; i < pageData['Required'].length; i++ ) {
        for( var key in pageData['Required'][i]) {
          required[key] = pageData['Required'][i][key];
          break;
        }
    }

    for ( var i = 0; i < schemas.length; i++ ) {
      var schemaType = schemas[i]['Type'];
      var schemaCopy = schemas[i]['Schema'][0];
      schemaList[schemaType] = [];
      var html = '<li><a href="#' + schemaType + '">' +
      schemaType + '</a></li>';

      $( '#schemaLinks' ).append( html );
      html = '<div id="' + schemaType + '">' + '</div>';
      $( '#tabs' ).append(html);
      schemaObject[schemaType] = blankSchema(schemaCopy);
      createTable( schemaCopy, schemaType, pubsColumns, softwareColumns, autoData );
    }

    for( var i = 0; i < pageData['Help_Menu'].length; i++) {
      var currentMenu = pageData['Help_Menu'][i]
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

    $( ".autoComplete.single" )
    .autocomplete({
      minLength: 1,
      select: function( event, ui ) {
        this.value = ui.item.value;
        $(this).trigger('autosize.resize');
      }
    });

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
    
    $.each( $(".autoComplete.single"), function() {
      var data_label = $( this ).attr( 'data-label' );
      $( this )
        .autocomplete({
          source: pageData['Auto_Data'][data_label]
        });
    });
    
    $.each( $( "textarea[data-label='DARPA Program Name'],\
    textarea[data-label='DARPA Program']" ), function( event, ui ) {
      $( this )
        .autocomplete({
          source: pageData['Program_Names']
        });
    });

    $( '.sortable' ).sortable();
    $( '.sortable' ).disableSelection();
    $( '#tabs' ).tabs();
    $( 'textarea' ).autosize();  
    
    $( '.submit' ).click( function () {
      var serverSubmit = {};
      serverSubmit['Entries'] = schemaList;
      serverSubmit['User'] = getCookie('fname') + '_' + getCookie('lname');
      var submission = JSON.stringify(serverSubmit);
      submission = submission.replace(/&lt/g,'<').replace(/&gt/g,'>');
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

    $( '.append' ).click( function () {
      var schemaType = $( this ).attr('schema');
      var selector = 'textarea' + '.' + schemaType;
      var schemaCopy = blankSchema(schemaObject[schemaType]);
      var badData = false;
      $( '#errorList').empty();
      $( selector ).each( function() {
        var dataLabel = $( this ).attr( 'data-label' );
        var multiple;
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

        attribute = validate(multiple, attribute, dataLabel, schemaType);
        if( attribute !== false ) {
          schemaCopy[dataLabel] = attribute;  
        }
        else {
          badData = true;
        }
      }); 
  
      if( !badData ) {
        var selector = '#error';
        $( '#errorList').empty();
        $( ':checked.' + schemaType ).each( function() {
          var dataLabel = $(this).attr('name');
          schemaCopy[dataLabel].push($(this).val());
        });

        if( $( selector ).is(":visible") ) {
          $( selector ).hide();
        }
        
        addButtonMenu(schemaCopy);
        $( "#addMenu" ).dialog({
          resizable: false,
          modal: true,
          width: 1000,
          height: 500,
          buttons: {
            "Confirm": function() {
              $( this ).dialog( "close" );
              schemaList[schemaType].push(schemaCopy);
              clearTab(schemaType);
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
