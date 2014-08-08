$( function() {
  var autoComplete = {};
  autoComplete['autoFields'] = ['Program Teams', 'Categories', 'Subcategories',
  'Display Software Columns', 'Display Pubs Columns', 'Long Name', 'DARPA Office'];
  var json_post = JSON.stringify(autoComplete);

  $.post("/wsgi-scripts/auto_data.py", json_post, function( data ) {
    console.log( data );
    createPage( data );
    });

  $( "#submitTxt" ).hide();

  function split( val ) {
    return val.split( /,\s*/ );
  }

  function extractLast( term ) {
    return split( term ).pop();
  }
  
  function addCheckBoxes ( checkBoxes, schemaType, dataLabel ) {
    var html = "";
    for ( var i = 0; i < checkBoxes.length; i++ ) {
      selectValue = checkBoxes[i];
      html += '<li class="ui-state-default">';
      //html += '<span class="ui-icon ui-icon-arrowthick-2-n-s"></span>';
      html += '<input type="checkbox" name="' + dataLabel +
      '" value="' + selectValue + '" class="' + schemaType +
      '" checked="checked">' + selectValue + '<br>';

    }
    return html;
  }

  function createTable ( schema, schemaType, pubColumns, softwareColumns) {
    var id = schemaType + "t";
    var table = '<table id="' + id +
    '"><tr><th>Name</th><th>Value</th>' +
    '</tr>';
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
        if ( autoComplete['autoFields'].indexOf(key) >= 0 ){
          tableRow +=' autoComplete"';
        }
        else{
          tableRow +='"';
        }
        tableRow += ' data-label="' + key +
        '">' + '</textarea>';
      }
      
      tableRow += '</td><td><button class="helpBtn ' +
      schemaType + 'b">Help</button>' + '</td></tr>';
      table += tableRow;
    }

    var submitBtns = '<tr><td></td><td class="lastRow">' +
    '<button class="append">Add</button>' +
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
    var schemas = pageData['Schemas'];
    var pubsColumns = pageData['Auto_Data']['Display Pubs Columns'];
    var softwareColumns = pageData['Auto_Data']['Display Software Columns'];
    for ( var i = 0; i < schemas.length; i++ ) {
      var schemaType = schemas[i]['Type'];
      var html = '<li><a href="#' + schemaType + '">' +
      schemaType + '</a></li>';
      $( '#schemaLinks' ).append( html );
      html = '<div id="' + schemaType + '">' + '</div>';
      $( '#tabs' ).append(html);
     
      createTable( schemas[i]['Schema'][0], schemaType, pubsColumns, softwareColumns );
    }
    
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
          this.value = terms.join( ", " );
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
          minLength: 1,
          source: pageData['Auto_Data'][data_label]
        });
    });
    
    $.each( $( "textarea[data-label='DARPA Program Name'],\
    textarea[data-label='DARPA Program']" ), function() {
      $( this )
        .autocomplete({
          minLength: 1,
          source: pageData['Program_Names']
        });
    });
    
    $( '.sortable' ).sortable();
    $( '.sortable' ).disableSelection();
    $( '#tabs' ).tabs();
    $( 'textarea' ).autosize();  
  }
});
