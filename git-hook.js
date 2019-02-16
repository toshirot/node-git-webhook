'use strict';

/*
github リポジトリへのpushなどだけでサーバー側に自動デプロイする。
これは、例えば example.netというレポジトリのdev-2fブランチへのpushをすると
サーバー側の /pathTo/example.net 以下の内容を git からpull して更新する

1) パス例
    pathTo/
        └── example.net
                ├── html     
                ├── server
                └── etc..

2) github > settings > WebHook の Payload URL に
　  https://<HOST名>:<PORT名>

3) github > settings > WebHook の Content type
    application/json

4) github > settings > WebHook の Secret
    conf.js に書いたのと同じシークレット

5) github > settings > WebHook の SSL verification
    今時は、✔️Enable SSL verification  要WebのSSL設定

6) github > settings > WebHook の Which events would you like to trigger this webhook?
    このWebhookをトリガーしたいイベントはどれですか？
    ✔️Just the push event.

7) github > settings > WebHook の Active
    ✔️Active
    
8) ssh-keygenで秘密鍵、公開鍵を作る
    sudo ssh-keygen -t rsa -b 4096 -C "Your@e-mail"  -f /root/.ssh/id_rsa_github_example.net

    これで 
    /root/.ssh/id_rsa_github_example.net 秘密鍵
    /root/.ssh/id_rsa_github_example.net.pub　公開鍵
    が生成される

    この公開鍵を github settings > Deploy keys へ追加する

9) プライベートリポジトリの場合は、.ssh/configに鍵のパスを登録しておく

    sudo vi /root/.ssh/config

    # example.com
    Host            example.com
    HostName        example.com
    Port            7890
    IdentityFile   /root/.ssh/id_rsa
    User            root
    IdentitiesOnly yes

    # example.net
    Host            example.net
    HostName        example.net
    Port            8888
    IdentityFile   /root/.ssh/id_rsa_github_example.net
    User            root
    IdentitiesOnly yes
*/

// import
const fs = require('fs');
const https = require('https');
const crypto = require('crypto');
const exec = require('child_process').exec;

// https server setting
const PORT = '8888'; 
const HOST='example.net';
const pemPath='/etc/letsencrypt/live/'+HOST;// path of letsencript pem 
const CERT = fs.readFileSync(pemPath+'/fullchain.pem');
const KEY = fs.readFileSync(pemPath+'/privkey.pem');

// config のSECRETは git webhookへもセットする
const conf=require(__dirname+'/conf');
const SECRET = conf[HOST].secret;

// git settings
const BRANCHName='dev-2f';// 'master'|'dev-2f'
const targetBRANCH = 'refs/heads/'+BRANCHName;//'refs/heads/master'|'refs/heads/dev-2f'
const targetRepositoryDir='/home/tato/'+HOST;
const pullStr='sudo git pull origin '+BRANCHName;
const REPOSITORY_NAME = HOST;

// log file
const logFilePath = '/home/tato/webhook/log/'+HOST+'.log';

// ----------------------------------------------------------------------------
// HTTPSサーバー
// 
const option={
    cert: CERT,
    key: KEY,
};
const server = new https.createServer(option, function (req, res){

    let payload='';
    req.on('data', function(chunk) {
        
        payload+=chunk.toString();
        // chk SECRET
        if(!chkSECRET(req, payload))return;
        // parse payload
        try{
            payload=JSON.parse(payload);
        } catch(e){
            console.log('parse err', e)
        }

        // chk repositoryName
        if(!chkRepositoryName(payload))return;

        // chk target BRANCH
        if(!chkBranchName(payload))return;
    
        // do pull
        exec(pullStr, { cwd: targetRepositoryDir }, (error, stdout, stderr) => {
            if (error) {
                writeLog(`exec error: ${error}`);
                return;
            }
            writeLog(`3 stdout: ${stdout}`);
            writeLog(`3 stderr: ${stderr}`);
        });

    });
    res.end();

}).listen(PORT);

// ----------------------------------------------------------------------------
// シークレットのチェック 
// @return true|false
// 
function chkSECRET(req, data){
    console.log(201,'chkSECRET', SECRET)
    // chk SECRET 
    let sig = ''
        + 'sha1='
        + crypto
        .createHmac('sha1', SECRET)
        .update(data)
        .digest('hex');
         
            console.log('x-hub-signature !== sig '
                , (req.headers['x-hub-signature'] !== sig)
                , req.headers['x-hub-signature']
                , sig
                )
         
    if (req.headers['x-hub-signature'] !== sig){
        return false;//シークレットが違えばパス
    } else {
        return true;
    }
}

// ----------------------------------------------------------------------------
// リポジトリ名のチェック 
// @return true|false
// 
function chkRepositoryName(payload){
    let repositoryName = payload.repository.name;
    console.log(555,'chkRepositoryName', REPOSITORY_NAME===repositoryName, REPOSITORY_NAME, repositoryName)

    if(REPOSITORY_NAME!==repositoryName){
        return false;//リポジトリ名が違えばパス
    } else {
        return true;
    }
}

// ----------------------------------------------------------------------------
// ブランチ名のチェック 
// @return true|false
// 
function chkBranchName(payload){
    console.log(666, 'chkBranchName', payload.ref===targetBRANCH, payload.ref, targetBRANCH)
    if(payload.ref!==targetBRANCH){
        return false;//ブランチ名が違えばパス
    } else {
        return true;
    }
}

// ----------------------------------------------------------------------------
// logの出力
// 
const writeLog = function (data){
    ifNotExistMkNewFile(logFilePath);
    console.log(222,  getYMDHMiS() + ' ' +data);
    fs.appendFile(logFilePath,  getYMDHMiS() +' '+ data+'\n', function (err) {
        if (err) {
            console.log(getYMDHMiS() +'error:'+  err);
            writeLog(getYMDHMiS() +'error:'+  err+'\n');
            throw err;
        }
    });
}

// ----------------------------------------------------------------------------
// Date関連 for log
// 
function getTimesInt(str, date){
    /* e.g.
      getTimesInt('Y');//2017
  
      var H = getTimesInt('H');
      var Mi= getTimesInt('Mi');
      var HM= H+':'+Mi; //'8:30'
  
      var W = getTimesInt('W');
      var week = new Array('日', '月', '火', '水', '木', '金', '土');
      week[W]; 
    */
    var curr = (date)?new Date(date):new Date();
    var Y  = +curr.getFullYear()
    var M  = +curr.getMonth()+1
    var D  = +curr.getDate()
    var H  = +curr.getHours()
    var Mi = +curr.getMinutes()
    var S  = +curr.getSeconds()
    var Ms = +curr.getMilliseconds()
    var W  = +curr.getDay()
  
    switch(str){
      case 'Y': return Y;break;
      case 'M': return M;break;
      case 'D': return D;break;
      case 'H': return H;break;
      case 'Mi': return Mi;break;
      case 'S': return S;break;
      case 'Ms': return Ms;break;
      case 'W': return W;break;
      default: return curr;
    }
    str= date=curr=Y=M=D=H=Mi=S=Ms=W=null;
  }
  function zero(num){//e.g. 3->'03'
    return num<10?'0'+num:''+num;
  }
  function getYMDHMiS(date){
    var Y = getTimesInt('Y',date);
    var M= getTimesInt('M',date);
    var D= getTimesInt('D',date);
    var H = getTimesInt('H',date);
    var Mi= getTimesInt('Mi',date);
    var S= getTimesInt('S',date);
    return Y+'-'+zero(M)+'-'+zero(D)+' '+zero(H)+':'+zero(Mi)+' '+zero(S); //'2017-01-04 08:30 05'
  }

// ----------------------------------------------------------------------------
// logFilePathファイルが存在しなければ作る for log
// 
function ifNotExistMkNewFile(file){
    if(!isExistFile(logFilePath)){
        fs.writeFile(logFilePath, '', function (err) {
            if (err) {
                throw err;
            }
        })
    }
}

// ----------------------------------------------------------------------------
// ファイルの存在チェック for log
// @return true|false
// 
function isExistFile(file) {
    try {
      fs.statSync(file);
      return true
    } catch(err) {
      if(err.code === 'ENOENT') return false
    }
}