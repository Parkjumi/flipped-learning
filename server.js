var express = require('express');
var http = require('http');
var app = express();
var conn = require('connect');
var mysql = require('mysql');
var path = require('path');
var bodyparser = require('body-parser');
var session = require('express-session');
var ejs = require('ejs');
var multer = require('multer');

var server = app.listen(3000, function () {
  console.log("서버 연결 성공!");
});

var conn = mysql.createConnection({
  host:'localhost',
  user:'root',
  password:'20152595',
  database:'flipped'
});

app.use(bodyparser.json());

app.use(bodyparser.urlencoded({
    extended: true
}));

app.use(session({
  secret : 'my key',
  resave: true,
  saveUninitialized: true,
	cookie: {
    maxAge: 1000 * 60 * 60 // 쿠키 유효기간 1시간
  }
}));

conn.connect(function (err) {
  if(!err){
    console.log("Database 연결 성공 !");
  }else{
    console.log("Database 연결 실패 !");
  }
});

app.set('view engine', 'ejs');
app.set('views');

app.use(express.static(path.join(__dirname)));

app.get('/', function (req, res) {
  if(req.session.user){
    res.redirect('/list');
  }else{
    res.render('login');
  }
}); //메인.ejs 불러오기

app.get('/main/:studyTitle', function (req, res) { //메인 페이지
  var studyTitle = req.params.studyTitle;
  var id = req.session.user.id;
  var name = req.session.user.name;

  var studygroup; //스터디 그룹 엔티티
  var notice; // 공지사항 엔티티
  var index; //id와 제목 비교
  var material;
  var student;
  var comment;
  var studentgroup;

  if(req.session.user){
    var sql = "select * from studygroup where studyTitle=?";
    var sql2 = "select * from notice where studyTitle=?";
    var sql3 = "select * from material where studyTitle=?";
    var sql4 = "select * from studentgroup where studentId=?";
    var sql5 = "select * from comment where studyTitle=?";
    var sql6 = "select * from studentgroup where studyTitle=?"
    var sql7 = "SELECT studentgroup.*,student.* FROM studentgroup INNER JOIN student ON studentgroup.studentId=student.studentId where studentgroup.studyTitle=?";

    conn.query(sql,studyTitle,function (err,rows) {
      studygroup = rows;
      conn.query(sql2,studyTitle,function  (err,rows) {
        notice = rows;
        conn.query(sql3,studyTitle,function (err,rows) {
          material = rows;
          conn.query(sql4,id,function (err,rows) {
            student = rows;
            conn.query(sql5,studyTitle,function (err,rows) {
              comment = rows;
              conn.query(sql6,studyTitle,function (err,rows) {
                studentgroup = rows;
                conn.query(sql7,studyTitle,function (err,rows) {
                  res.render("index",{studentName:rows,studentgroup:rows,name:name,title:studygroup[0].studyTitle,student:student,first:studygroup[0].first,notice:notice,material:material,studygroup:studygroup,comment:comment});
                })
              })
            })
          });
        })
      });
    });
  }else{
    res.render('login');
  }
});

app.post('/login', function (req, res) { //로그인 과정
  var id = req.body.id;
  var pw = req.body.password;
  var data;
  var test;

  var sql = "select * from student where studentId=? and studentPw=?";

  conn.query(sql, [id,pw], function (err,rows) {
    test = rows; //로그인
    // res.render("index");
    if(rows.length > 0){
      req.session.user ={
        id :test[0].studentId,
        name:test[0].studentName,
        school:test[0].school,
        major:test[0].major,
        authorized:true
      };

      req.session.save(function () {
          var sql2 = "select * from studygroup";
          var sql3 = "select * from studentgroup where studentId=?";
          conn.query(sql2,function(err,rows){
            if(err) console.log('err',err);
            data = rows; //스터디 그룹 목록
            conn.query(sql3,id,function (err,rows) {
              res.redirect('/list');
            })
          });
      })
    }else{
      console.log('로그인 실패!');
      res.send('<script>alert("로그인 실패! 다시 로그인해주세요.");location.href="/";</script>');
    }
  })
}); //메인.ejs 불러오기

app.get('/logout', function (req,res) { //로그아웃 페이지
  req.session.destroy(function (err) {
    res.send('<script>alert("로그아웃 되었습니다!");location.href="/";</script>');
  })
});

app.get('/list', function (req,res) { //스터디 목록 확인 페이지
  var sql = "select * from studygroup";
  var sql2 = "select * from studentgroup where studentId=?";
  var id = req.session.user.id;
  var data;
  conn.query(sql,function(err,rows){
    data = rows;
    conn.query(sql2,id,function(err,rows){
      res.render('list',{data:data,length:data.length,studygroup:rows});
    });
  });
});

app.get('/approve', function (req,res) { //스터디 그룹 등록
  if(req.session.user){
    var sql = "select * from studentgroup where studentId=?";
    var id = req.session.user.id;
    conn.query(sql,id,function(err,rows){
      res.render('Approve',{length:rows.length,studygroup:rows,data:req.session.user});
    });
  }else{
    res.send('<script>alert("로그인 후 이용하실 수 있습니다.");location.href="/login";</script>');
  }
});

app.post('/approve', function (req,res) { //스터디 그룹 등록 과정
  var name = req.body.name;
  var school = req.body.school;
  var major = req.body.major;
  var studyTitle = req.body.studyTitle;
  var studyTopic = req.body.studyTopic;
  var role = req.body.role;
  var active = req.body.active;
  var teacher = req.body.teacher;
  var max = req.body.max;
  var meet = req.body.meet;
  var content = req.body.content;
  var index = [studyTitle,studyTopic,role,active,teacher,max,meet,'승인대기',name,content];

  var sql = "insert into studygroup(studyTitle,studyTopic,role,active,teacher,max,meet,append,first,content) values(?,?,?,?,?,?,?,?,?,?)";
  conn.query(sql,index,function (err,rows) {
    res.send('<script>alert("스터디 그룹이 등록되었습니다!");location.href="/list";</script>');
  });
});

app.post('/detail', function (req,res) { // 스터디 그룹 상세보기
  var title = req.body.title;
  var id = req.session.user.id;
  var sql = "select * from studygroup where studyTitle=?";
  conn.query(sql,title,function (err,rows) {
    var sql2 = "select * from student where studentName=?";
    var sql3 = "select * from studentgroup where studentId=?";
    var data = rows[0];
    conn.query(sql2,data.first,function (err,rows) {
      var data2 = rows[0];
      conn.query(sql3,id,function (err,rows) {
        res.render('detail',{data:data,student:data2,studygroup:rows,length:rows[0].length});
      })
    })
  });
});

app.post('/requested', function (req,res) { //스터디 그룹 승인 과정
  var studyTitle = req.body.studyTitle;
  var id = req.session.user.id;

  var sql = "insert into studentgroup (studentId,studyTitle) values(?,?)";
  var sql2 = "select * from studygroup where studyTitle=?";
  var sql3 = "select * from studentgroup where studyTitle=?";
  var sql4 = "update studygroup set append=? where studyTitle=?";

  var index = [id,studyTitle]; // 스터디 그룹 신청
  var max;
  var length;
  var index2 = ["승인",studyTitle];

  conn.query(sql,index,function (err,rows) {
    conn.query(sql2,studyTitle,function (err,rows) {
        max = rows[0].max;
        conn.query(sql3,studyTitle,function (err,rows) {
          if(err) console.log('err3',err);
          length = rows.length;
          if(max === length){
            conn.query(sql4,index2,function (err,rows) {
              res.send('<script>alert("스터디 가입이 되었습니다!");location.href="/";</script>');
            });
          }else{
            res.send('<script>alert("스터디 가입이 되었습니다!");location.href="/";</script>');
          }
        });
    });
  });
});

app.get('/studysetting/:studyTitle', function (req,res) { //스터디 설정 페이지
  var name = req.session.user.name;
  var studyTitle = req.params.studyTitle;
  var sql = "select * from studygroup where studyTitle=?";
  conn.query(sql,studyTitle,function (err,rows) {
    res.render('studysetting',{data:rows[0],studyTitle:studyTitle});
  });
});

app.post('/studysetting/:studyTitle', function (req,res) { //스터디 설정 수정
  var role = req.body.role;
  var active = req.body.active;
  var teacher = req.body.teacher;
  var max = req.body.max;
  var meet = req.body.meet;
  var content = req.body.content;
  var studyTitle = req.params.studyTitle;
  var name = req.session.user.name;

  var sql = "update studygroup set role=?,active=?,teacher=?,meet=?,content=? where first=?";
  var index = [role,active,teacher,meet,content,name];

  conn.query(sql,index,function (err,rows) {
    res.send('<script>alert("스터디 그룹정보가 변경되었습니다!");location.href="/studysetting";</script>');
  });
});

app.get('/board/:title', function (req,res) { // 공지사항 페이지
  var sql = "select * from notice where studyTitle=?";
  var title = req.params.title;

  conn.query(sql,title,function (err,rows) {
    res.render('board',{data:rows});
  });
});

app.get('/materialupload/:studyTitle', function (req,res) { //자료 업로드 페이지
  var studyTitle = req.params.studyTitle;
  var name = req.session.user.name;
  var sql = "select * from studygroup where studyTitle=?";

  conn.query(sql,studyTitle,function (err,rows) {
    res.render('materialupload',{studyTitle:studyTitle,name:name,first:rows[0].first});
  })
});

var storage = multer.diskStorage({ // 파일 업로드 소스
  destination: function (req, file, cb) {
    cb(null, 'files/') // cb 콜백함수를 통해 전송된 파일 저장 디렉토리 설정
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname) // cb 콜백함수를 통해 전송된 파일 이름 설정
  }
})
var upload = multer({ storage: storage });

app.post('/materialupload/:studyTitle', upload.single('userfile'), function (req,res) { //자료 등록 과정
  var file = req.file;
  var attachments;
  if(req.fie != undefined){
    attachments = file.originalname;
  }else{
    attachments = null;
  }
  var materialTitle = req.body.materialTitle;
  var content = req.body.materialContent;
  var tag = req.body.tag;
  var id = req.session.user.id;
  var studyTitle = req.params.studyTitle;

  var today = new Date();
  var date = today.getFullYear()+"년"+(today.getMonth() + 1)+"월"+today.getDate()+"일";
  var sql = "select * from studentgroup"
  var sql2 = "insert into material(studentId,studyTitle,materialTitle,tag,attachments,materialDate,materialContent) values (?,?,?,?,?,?,?)";
  var index = [id,studyTitle,materialTitle,tag,attachments,date,content];
  conn.query(sql2,index,function (err,rows) {
    res.send(`<script>alert("자료가 등록되었습니다!");location.href="/main/${studyTitle}";</script>`);
  })
});

app.post('/materialList/:materialNum/:title', function (req,res) { //자료 상세보기
  var materialNum = req.params.materialNum;
  var title = req.params.title;
  var id = req.session.user.id;
  var name = req.session.user.name;
  var sql = "select * from material where materialNum=? and studyTitle=?";
  var sql2 = "select * from comment where materialNum=?";
  var sql3 = "select * from studygroup where studyTitle=?";
  var index = [materialNum,title];
  var data;
  var comment;

  conn.query(sql,index,function (err,rows) {
    data = rows;
    conn.query(sql2,materialNum,function (err,rows) {
      comment = rows;
      conn.query(sql3,title,function (err,rows) {
        res.render("materialList",{studygroup:rows[0],name:name,first:rows[0].first,material:data[0],materialNum:materialNum,tag:data[0].tag,studyTitle:title,comment:comment});
      })
    })
  });
});

app.post('/comment/:materialNum/:studyTitle', function (req,res) { // 댓글 등록 과정
  var content = req.body.content;
  var id = req.session.user.id;
  var materialNum = req.params.materialNum;
  var studyTitle = req.params.studyTitle;
  var today = new Date();
  var date = today.getFullYear()+"년"+(today.getMonth() + 1)+"월"+today.getDate()+"일"+today.getHours()+"시"+today.getMinutes()+"분";

  var sql = "select * from student where studentId=?";
  var sql2 = "insert into comment(materialNum,studyTitle,studentId,name,content,date) values(?,?,?,?,?,?)";
  var index;
  var name;

  conn.query(sql,id,function (err,rows) {
    name = rows[0].studentName;
    index = [materialNum,studyTitle,id,name,content,date];
    conn.query(sql2,index,function (err,rows) {
      res.send(`<script>alert("댓글이 등록 되었습니다!");location.href="/main/${studyTitle}";</script>`);
    });
  })
});

app.post('/commentApprove', function (req,res) { //댓글 승인 과정
  var num = req.body.num;
  var checked = req.body.checked;
  var id = req.body.id;
  var title = req.body.title;
  var sql = "update comment set state=? where commentNum=?";
  var sql2 = "update studentgroup set studyState=studyState+5 where studentId=? and studyTitle=?";
  var index = [checked,num];

  console.log(title+id);
  var data = [id,title];
  conn.query(sql,index,function (err,rows) {
    conn.query(sql2,data,function (err,rows) {
      if(checked == 'N'){
        res.send("승인이 취소되었습니다.");
      }else{
        conn.query(sql2,function (err,rows) {
          res.send("승인이 완료되었습니다.");
        })
      }
    })
  });
});

app.get('/materialList2/:title', function (req,res) { //자료 목록 확인 페이지
  var title = req.params.title;
  var name = req.session.user.name;
  var id = req.session.user.id;
  var material;
  var studygroup;

  var sql = "select * from material where studyTitle=?";
  var sql2 = "select * from studygroup where studyTitle=?";
  var sql3 = "select * from studentgroup where studentId=?";

  conn.query(sql,title,function (err,rows) {
    material = rows;
    conn.query(sql2,title,function (err,rows) {
      studygroup = rows;
      conn.query(sql3,id,function (err,rows) {
        res.render('materialList2',{student:rows,title:title,name:name,studygroup:studygroup,first:studygroup[0].first,material:material});
      })
    })
  })
})
