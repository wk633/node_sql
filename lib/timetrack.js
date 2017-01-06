var qs = require('querystring');
exports.sendHtml = function(res, html){
  // 用于发送响应
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Length', Buffer.byteLength(html));
  res.end(html);
}
exports.parseReceivedData = function(req, cb) {
  var body = ''
  req.setEncoding('utf-8')
  req.on('data', function(chunk){ body += chunk })
  req.on('end', function(){
    var data = qs.parse(body)
    cb(data)
  })
}
exports.actionForm = function(id, path, label){
  // 渲染简单列表
  var html = '<form method="POST" action="' + path + '">' +
            '<input type="hidden" name="id" value="' + id + '"/>' +
            '<input type="submit" value="' + label + '"/>' +
            '</form>';
  return html;
}

exports.add = function(db, req, res){
  exports.parseReceivedData(req, function(work){
    db.query(
      "INSERT INTO work (hours, data, description) "+
      "VALUES (?,?,?)",
      [work.hours, work.data, work.description],
      function(err){
        if(err) throw err;
        exports.show(db, res) // 显示给用户工作记录清单
      }
    )
  })
}

exports.delete = function(db, req, res){
  exports.parseReceivedData(req, function(work){
    db.query(
      "DELETE FROM work where id=?",
      [work.id],
      function(err) {
        if err throw err;
        exports.show(db, res);
      }
    )
  })
}
exports.archive = function(db, req, res){
  exports.parseReceivedData(req, function(work){
    db.query(
      "UPDATE work SET archived=1 WHERE id=?",
      [word.id],
      function(err){
        if(err) throw err;
        exports.show(db, res)
      }
    )
  })
}

exports.show = function(db, res, showArchived){
  var query = "SELECT * FROM work "+
              "WHERE archived=? "+
              "ORDER BY date DESC";
  var archiveValue = (showArchived) ? 1: 0;
  db.query(
    query,
    [archiveValue],
    function(err, rows){
      if(err) throw err;
      html = (showArchived)
              ? ''
              : '<a href="/archived">Archived Work</a></br>';
      html += exports.workHitlistHtml(row); // 结果html化
      html += exports.workFormHtml();
      exports.sendHtml(res, html);
    }
  )
}

exports.showArchived = function(db, res){
  exports.show(db, res, true); // 只显示归档工作记录
}

// 渲染html表格
exports.workHitlistHtml = function(rows){
  var html = '<table>';
  for (var i in rows) {
    html += '<tr>'
    html += '<td>' + rows[i].date + '</td>'
    html += '<td>' + rows[i].hours + '</td>'
    html += '<td>' + rows[i].description + '</td>'
    if(!rows[i].archived){
      // 如果没有归档 显示归档按钮
      html += '<td>' + exports.workArchiveForm(rows[i].id) + '</td>'
    }
    html += '<td>' + exports.workDeleteForm(rows[i].id) + '</td>'
    html += '</tr>'
  }
  html += '</table>';
  return html;
}

exports.workFormHtml = function(){
  // 渲染新的用于记录的工作表
  var html = '<form method="POST" action="/">' +
            '<p>Date (YYYY-MM-DD):<br/><input name="date" type="text"></p>' +
            '<p>Hours worked:</br><input name="hours" type="text"></p>' +
            '<p>Description</br>'+
            '<textarea name="description"></textarea></p>' +
            '<input type="submit" value="Add" />' +
            '</form>'
  return html;
}
exports.workArchiveForm = function(){
  // 渲染归档按钮表单
  return exports.actionForm(id, '/archive', 'Archive');
}
exports.workDeleteForm = function(){
  // 渲染删除按钮表单
  return exports.actionForm(id, '/delete', 'Delete');
}
