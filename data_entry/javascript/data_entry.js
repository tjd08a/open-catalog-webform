var schemaList = {};
var required = {};
function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  var expires = "expires="+d.toGMTString();
  document.cookie = cname + "=" + cvalue + "; " + expires +
  "; path=/";
}

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

$( function() {
  $( "#nameMenu" ).hide();
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
  
  $( "#error" ).hide();
  $( "#submitTxt" ).hide();
  $( "#addMenu" ).hide();

  var user = {};
  user['First'] = getCookie('fname');
  user['Last'] = getCookie('lname');
  var json_post = JSON.stringify(user);

  if (user['First'] != ''){
    $.ajax({
      type:'POST',
      url:'/wsgi-scripts/auto_data.py',
      data:json_post,
      success: function( data ) {
        console.log( data );
        createPage( data );
      }
    });
  }

  function clearTab(schemaType){
    var selector = 'textarea.' + schemaType;
    
    $( selector ).each( function () {
      $(this).val('');
    });
    
    selector = 'input.' + schemaType +
    '[type="checkbox"]';
    $( selector ).each( function() {
      this.checked = true;
    });
  }

  function addButtonMenu( schemaCopy ) {
    var jsonText = JSON.stringify(schemaCopy, undefined, 2);
    $( '#addMenuText' ).html(jsonText);
  }

  function scrollTo( elementID ) {
    var selector = "#" + elementID;
    $('html, body').animate({
      scrollTop: $(selector).offset().top
    }, 500);
  }

  function validate( multiple, attribute, location, type) {
    try {
      var validAttr = attribute.trim();
      if (validAttr == "") {
        if ( required[type].indexOf(location) > -1 ) {
          throw "This field is required.";
        }

        if ( multiple ) {
            validAttr = [''];
        }
        return validAttr;
      }

      if ( multiple ) {
        var valueList = validAttr.split(/\r\n|\n|\r/);
        var finalList = [];     
        for( var i = 0; i < valueList.length; i++ ) {
          var value = valueList[i];
          value = value.trim();
        
          // Ignores blank values in a list
          if (value != "") {
            finalList.push(value); 
          }    
  
        }  
        validAttr = finalList; 
      }
    }   
    catch(err) {
      addError( err, location );
      $( '#error').show();
      scrollTo('error');
      return false;
    }
     
    return validAttr;
  }

  function blankSchema( schema ) {
    var schemaCopy = {};
    for (var attribute in schema) {
      if( schema[attribute] instanceof Array ) {
        schemaCopy[attribute] = [];
      }
      else {
        schemaCopy[attribute] = "";
      }
    }
    return schemaCopy
  }

  function split( val ) {
    return val.split( /\n\s*/ );
  }

  function extractLast( term ) {
    return split( term ).pop();
  }
    
  function addError( error, location ) {
    var errorText = '<li>Error in "' + location +
    '": ' + error + '</li>';
    $( '#errorList' ).append( errorText );
  }
  
  function addCheckBoxes ( checkBoxes, schemaType, dataLabel ) {
    var html = "";
    for ( var i = 0; i < checkBoxes.length; i++ ) {
      selectValue = checkBoxes[i];
      html += '<li class="ui-state-default">';
      html += '<input type="checkbox" name="' + dataLabel +
      '" value="' + selectValue + '" class="' + schemaType +
      '" checked="checked">' + selectValue + '<br>';
    }

    return html;
  }
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
      addMenu(currentMenu['Schema'], currentMenu['Menu'])
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
      $( "#submitMenu" ).dialog({
          resizable: false,
          modal: true,
          width: 300,
          height: 200,
          buttons: {
            "Confirm": function() {
              $( this ).dialog( "close" );
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
