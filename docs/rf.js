var cdb = null;
function login( no_ui ){
  var username = $('#db_username').val();
  var password = $('#db_password').val();
  var base_url = $('#db_base_url').val();

  cdb = new CouchDB_CRUD_SDK( username, password, base_url );

  cdb.readAllDbs().then( function( r ){
    if( r && r.status ){
      var dbs = r.result;
      //.console.log( {dbs} );
      if( dbs.length >= 0 ){
        $('#nav-bar-0').css( 'display', 'none' );
        $('#nav-bar-1').css( 'display', 'block' );

        if( !no_ui ){
          var dbs_list = '<table class="table">'
            + '<tr><th>'
            + '<button class="btn btn-xs btn-secondary" onClick="reload_db()">Reload</button>'
            + '<button class="btn btn-xs btn-primary" onClick="create_db()">Create DB</button>'
            + '</th></tr>';
          for( var i = 0; i < dbs.length; i ++ ){
            dbs_list += '<tr><td class="dbname dbname-' + dbs[i] + '"><a href="#" onClick="get_docs(\'' + dbs[i] + '\')">' + dbs[i] + '</a></td></tr>';
          }
          dbs_list += '</table>';
          $('#dbs_list').html( dbs_list );
        }
      }
    }else{
      if( !no_ui ){
        $('#dbs_list').html( '' );
      }
    }
  });
}

function reload_db(){
  $('#dbs_list').html( '' );
  $('#docs_list').html( '' );

  login();
}

async function create_db(){
  var dbname = prompt( '新たに追加するデータベース名を入力してください', '' );
  if( dbname ){
    var r = await cdb.createDb( dbname );  //. { ok: true }
    if( r && r.status ){
      reload_db();
    }
  }
}

async function delete_db( db ){
  if( confirm( 'データベース: '+ db + 'を本当に削除しますか？' ) ){
    var r = await cdb.deleteDb( db );  //. { ok: true }
    if( r && r.status ){
      reload_db();
    }
  }
}

async function create_doc( db ){
  $('#edit_db').val( db );
  $('#edit_doc_id').val( '' );
  $('#edit_subject').val( '' );
  $('#edit_username').val( '' );
  $('#edit_body').val( '' );

  //$('#edit_attachment_td').html( '<input type="file" id="edit_attachment"/>' );
  //. #12
  var edit_attachment_td = '<div id="div_attachment"><label><input type="file" id="edit_attachment"/>ファイル添付</label><span id="edit_attachment_filename">選択されていません</span></div>';
  $('#edit_attachment_td').html( edit_attachment_td );
  $('#div_attachment #edit_attachment').on( 'change', function(){
    var file = $(this).prop( 'files' )[0];
    $(this).closest( '#div_attachment' ).find( '#edit_attachment_filename' ).text( file.name );
  });

  $('#editModal').modal();
}

async function get_docs( db ){
  $('.dbname').removeClass( 'selected' );
  $('.dbname-' + db).addClass( 'selected' );

  var r = await cdb.readAllDocs( db );
  if( r && r.status ){
    var docs = r.result;
    var docs_list = '<div><h2 id="db_name">' + db + '</h2></div>'
      + '<table id="docs_table" class="table table-bordered">'
      + '<thead>'
      + '<tr>'
      + '<th>filename</th>'
      + '<th>subject</th>'
      + '<th>username</th>'
      + '<th>timestamp</th>'
      + '<th>'
      + '<button class="btn btn-danger" onClick="delete_db(\'' + db + '\')">Delete DB</button>'
      + '<button class="btn btn-primary" onClick="create_doc(\'' + db + '\')">Create Doc</button>'
      + '</th>'
      + '</tr>'
      + '</thead>'
      + '<tbody>';
    for( var i = 0; i < docs.length; i ++ ){
      docs_list += '<tr>'
        + '<td><a href="#" onClick="get_doc(\'' + db + '\',\'' + docs[i]._id + '\')">' + ( 'filename' in docs[i] ? docs[i].filename : '' ) + '</a></td>'
        + '<td><a href="#" onClick="get_doc(\'' + db + '\',\'' + docs[i]._id + '\')">' + docs[i].subject + '</a></td>'
        + '<td><a href="#" onClick="get_doc(\'' + db + '\',\'' + docs[i]._id + '\')">' + docs[i].username + '</a></td>'
        + '<td><a href="#" onClick="get_doc(\'' + db + '\',\'' + docs[i]._id + '\')">' + timestamp2yyyymmdd( docs[i].timestamp ) + '</a></td>'
        + '<td>'
        + '<button class="btn btn-warning" onClick="edit_doc(\'' + db + '\',\'' + docs[i]._id + '\')">Edit</button>'
        + '<button class="btn btn-danger" onClick="delete_doc(\'' + db + '\',\'' + docs[i]._id + '\',\'' + docs[i]._rev + '\')">Delete</button>'
        + '</td>'
        + '</tr>';
      //console.log( docs[i] );
    }
    docs_list += '</tbody></table>';

    $('#docs_list').html( docs_list );

    //. #14
    $('#docs_table').DataTable({
      language: {
        url: 'https://cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/Japanese.json'   //. always https
      },
      columnDefs: [{
        targets: [ 4 ],
        orderable: false,
        searchable: false
      }]
    });
  }
}

async function get_doc( db, doc_id ){
  $('#doc_revs').html( '' );
  var r = await cdb.readAllRevisions( db, doc_id );
  if( r && r.status ){
    $('#view_db').val( db );
    $('#view_doc_id').val( doc_id );
    $('#view_filename').val( '' );
    $('#view_subject').val( '' );
    $('#view_username').val( '' );
    $('#view_body').val( '' );
    $('#view_timestamp').val( '' );

    $('#view_attachment').html( '' );
    $('#attachment_preview').html( '' );

    var revs = r.result;
    for( var i = 0; i < revs.length; i ++ ){
      //var opt = '<option value="' + revs[i] + '"' + ( i == 0 ? ' selected' : '' ) +  '>' + revs[i] + '</option>';
      var opt = '<option value="' + revs[i] + '">' + revs[i] + '</option>';
      $('#doc_revs').append( opt );
    }
    if( revs.length > 0 ){
      $('#doc_revs').val( revs[0] ).trigger( 'change' );  //. change() イベントを発火
    }

    $('#viewModal').modal();
  }
}

async function edit_doc( db, doc_id ){
  var r = await cdb.readDoc( db, doc_id );
  if( r && r.status ){
    var doc = r.result;
    $('#edit_db').val( db );
    $('#edit_doc_id').val( doc_id );
    $('#edit_subject').val( doc.subject );
    $('#edit_username').val( doc.username );
    $('#edit_body').val( doc.body );

    //$('#edit_attachment_td').html( '<input type="file" id="edit_attachment"/>' );
    //. #12
    var edit_attachment_td = '<div id="div_attachment"><label><input type="file" id="edit_attachment"/>ファイル添付</label><span id="edit_attachment_filename">選択されていません</span></div>';
    $('#edit_attachment_td').html( edit_attachment_td );
    $('#div_attachment #edit_attachment').on( 'change', function(){
      var file = $(this).prop( 'files' )[0];
      $(this).closest( '#div_attachment' ).find( '#edit_attachment_filename' ).text( file.name );
    });

    $('#editModal').modal();
  }
}

async function delete_doc( db, doc_id, doc_rev ){
  if( confirm( 'データベース: ' + db + ' から _id = ' + doc_id + ', _rev = ' + doc_rev + ' のファイルを本当に削除しますか？' ) ){
    var r = await cdb.deleteDoc( db, doc_id, doc_rev );  //. { ok: true }
    get_docs( db );
  }
}

$(function(){
  $('#doc_revs').change( async function(){
    var db = $('#view_db').val();
    var doc_id = $('#view_doc_id').val();
    var doc_rev = $('#doc_revs option:selected').val();
    var r = await cdb.readDoc( db, doc_id, doc_rev );
    if( r && r.status ){
      var doc = r.result;
      $('#view_filename').val( ( 'filename' in doc ? doc.filename : '' ) );
      $('#view_subject').val( doc.subject );
      $('#view_username').val( doc.username );
      $('#view_body').val( doc.body );
      $('#view_timestamp').val( timestamp2yyyymmdd( doc.timestamp ) );

      //. #8
      if( doc._attachments ){
        var html = '<button class="btn btn-success" onClick="show_file(\'' + db + '\',\'' + doc_id + '\',\'' + doc_rev + '\',\'' + doc.filename + '\')">' + doc.filename + '</button>';
        $('#view_attachment').html( html );

        //. #11
        var url = await get_file_url( db, doc_id, doc_rev, doc.filename );
        if( url ){
          var iframe = '<iframe src="' + url + '" width="300" height="100"></iframe>';
          $('#attachment_preview').html( iframe );
        }else{
          $('#attachment_preview').html( '(Preview unavailable for this contents)' );
        }
      }else{
        $('#view_attachment').html( '' );
        $('#attachment_preview').html( '' );
      }
    }
  });
});

//. 編集モーダルを閉じた時（ラベル以外の方法で新規か既存かを識別する必要がある）
async function save_doc(){
  var db = $('#edit_db').val();
  var doc_id = $('#edit_doc_id').val();
  var doc = null;

  if( !doc_id ){
    doc = { type: 'file' };
  }else{
    var r = await cdb.readDoc( db, doc_id );
    if( r && r.status ){
      doc = r.result;
    }
  }

  if( doc ){
    doc.subject = $('#edit_subject').val();
    doc.username = $('#edit_username').val();
    doc.body = $('#edit_body').val();
    doc.timestamp = ( new Date() ).getTime();

    var file_name = null;
    var selector = '#edit_attachment';
    try{
      var sel = document.querySelector( selector );
      if( sel && sel.files && sel.files.length >= 0 ){
        var file = sel.files[0];
        file_name = file.name;
        if( !( 'filename' in doc ) || !doc.filename ){
          doc.filename = file_name;
        }
      }
    }catch( e ){
    }

    //. #16
    cdb.saveDoc( db, doc_id, doc, '#edit_attachment', doc.filename ).then( async function( r1 ){
      $('#editModal').modal( 'hide' );
      get_docs( db );
    });
  }else{
    console.log( 'Failed to retrieve document for id = ' + doc_id + '.' );
    $('#editModal').modal( 'hide' );
    get_docs( db );
  }
}

//. #11
async function get_file_url( db, doc_id, doc_rev, filename ){
  var url = null;
  var r = await cdb.readFile( db, doc_id, doc_rev, filename );
  if( r && r.status ){
    var blob = r.result;  //. blob.type に Content-Type
    //console.log( {blob} );
    if( isPreviewable( blob.type ) ){
      url = URL.createObjectURL( blob );
    }
  }

  return url;
}

async function show_file( db, doc_id, doc_rev, filename ){
  var url = await get_file_url( db, doc_id, doc_rev, filename );
  if( url ){
    var a = document.createElement( "a" );
    document.body.appendChild( a );
    a.download = filename;
    a.href = url;
    a.click();
    a.remove();
    URL.revokeObjectURL( url );
  }
}

function timestamp2yyyymmdd( t ){
  if( typeof t == 'string' ){
    t = parseInt( t );
  }

  var dt = new Date();
  dt.setTime( t );
  var yyyy = dt.getFullYear();
  var mm = dt.getMonth() + 1;
  var dd = dt.getDate();
  var hh = dt.getHours();
  var nn = dt.getMinutes();
  var ss = dt.getSeconds();

  var yyyymmdd = yyyy
    + '-' + ( mm < 10 ? '0' : '' ) + mm
    + '-' + ( dd < 10 ? '0' : '' ) + dd
    + ' ' + ( hh < 10 ? '0' : '' ) + hh
    + ':' + ( nn < 10 ? '0' : '' ) + nn
    + ':' + ( ss < 10 ? '0' : '' ) + ss;

  return yyyymmdd;
}

function isPreviewable( type ){
  type = type.toLowerCase();
  var r = false;
  var previewables = [
    'application/pdf' 
  ];

  r = ( type.startsWith( 'image/' )
    || type.startsWith( 'audio/' ) 
    || type.startsWith( 'video/' ) 
    || type.indexOf( previewables ) > -1 );

  return r;
}

$(function(){
  /*
  $.extend( $.fn.dataTable.defaults, {
    language: {
      url: '//cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/Japanese.json'
    }
  });
  */
});
