# node-git-webhook
git-webhook by Node.js

#### ちょっと修正中 2022-09-07

Node.js で gitHub の Webhook を動かして快適なデプロイ生活を送らせて頂いてるのですが、自分だけ快適というのもあれなので、感謝の気持ちを込めて github にパブリックドメインで公開しました。発展途上でもあるので自己責任とバグ報告 ( https://github.com/toshirot/node-git-webhook/issues ) よろしくということで。

## 概要
github リポジトリへのpushなどだけでサーバー側に自動デプロイする。
これは、例えば example.netというレポジトリのdev-2fブランチへのpushをすると
サーバー側の /pathTo/example.net 以下の内容を git からpull して更新する。

## 設置例
```
    pathTo/
      ├── git-hook.js
      └── conf.js
```
## 設定手順例

#### 対象リポジトリ名
example.net
#### 対象ブラインチ名
dev-2f

#### 対象サーバーのパス例
```
    pathTo/
        └── example.net
                ├── html     
                ├── server
                └── etc..
```
#### githubの設定

https://chatfor.net/img/github-webhook-1.png

##### make access tokens
0)  github > Settings
![image](https://user-images.githubusercontent.com/154680/188914179-b3aafdf9-9273-4a69-8cbb-c3f7baf50b02.png)
0)  github > Settings >  Developer settings
![image](https://user-images.githubusercontent.com/154680/188914522-bddd0fb0-e643-4b84-bca1-f6f908977951.png)
0)  github > Settings >  Developer settings > Personal access tokens
![image](https://user-images.githubusercontent.com/154680/188914838-8b4bc4a4-81f7-47c7-92c5-9f444fc60bf5.png)
0)  github > Settings >  Developer settings > Personal access tokens > Generate new token
![image](https://user-images.githubusercontent.com/154680/188915091-2dd09db6-0e6b-4a9f-9aad-28ac776e487e.png)
![image](https://user-images.githubusercontent.com/154680/188915390-3a378051-9ea9-40c6-9699-8cc3e4ddce1f.png)

##### set WebHook

1) github > settings > WebHook の Payload URL に
```
　  https://<HOST名>:<PORT名>
    e.g. https://example.com:8888
```
2) github > settings > WebHook の Content type
```
    application/json
```
3) github > settings > WebHook の Secret
```
     make access tokens で作った Secretトークンを入れる
     デプロイ側の conf.js にも書く
```
4) github > settings > WebHook の SSL verification
```
    今時は、✔️Enable SSL verification  要WebのSSL設定
```
5) github > settings > WebHook の Which events would you like to trigger this webhook?
```
    このWebhookをトリガーしたいイベントはどれですか？
    ✔️Just the push event.
```
6) github > settings > WebHook の Active
```
    ✔️Active
```

#### 対象デプロイサーバー側の設定

1) ssh-keygenで秘密鍵、公開鍵を作る
```
    sudo ssh-keygen -t rsa -b 4096 -C "Your@e-mail"  -f /root/.ssh/id_rsa_github_example.net
```

これで 

```
    /root/.ssh/id_rsa_github_example.net 秘密鍵
    /root/.ssh/id_rsa_github_example.net.pub　公開鍵
```

が生成される　
    （※ ここでは、 https の ssl の鍵に root権限 が必要なので sudo で動かすことを前提にしています。 
       sudo 以外で動かすときはその部分をそれぞれの権限用に読み替えてください。）

```
    この公開鍵を github settings > Deploy keys へ追加する
```
    
2) プライベートリポジトリの場合は、.ssh/configに鍵のパスを登録しておく
```
    sudo vi /root/.ssh/config
```
```
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
```

#### 足りないモジュールを読み込んでおく

```
npm i crypto --save
```
暗号関連のメジャーなモジュールです。シークレットのチェックに使っています。

#### 対象デプロイサーバー側での起動とデーモン

```
$ git config --global user.name "xxxx"
$ git config --global user.email "xxxxxx@gmail.com"
$ git init

```

pm2やforeverなどでgit-hook.jsを起動します。

```
sudo pm2 start /pathTo/git-hook.js
```

#### 参考：pm2 や node を root で動かすには　(Ubuntu で NVMを使うケース)
```
//////////////////////////////////////////////
nvmでnode.jsインストール

sudo apt install git-core
git clone git://github.com/creationix/nvm.git ~/nvm

. ~/nvm/nvm.sh
echo ". ~/nvm/nvm.sh" >> ~/.bashrc

//////////////////////////////////////////////
node.jsインストール 

ここではv10の最新を入れる

$ nvm install v10
//////////////////////////////////////////////
pm2 インストール 

npm install pm2 -g

sudo pm2 start hoge.js したあと自動起動するには
sudo pm2 startup ubuntu
sudo pm2 save

//////////////////////////////////////////////
$ which node
/home/hoge/nvm/versions/node/v10.15.1/bin/node
$ which pm2
/home/hoge/nvm/versions/node/v10.15.1/bin/pm2

wssをrootで実行するためにリンクを張っておく
sudo ln -s /home/hoge/nvm/versions/node/v10.15.1/bin/node /usr/bin/node
sudo ln -s /home/hoge/nvm/versions/node/v10.15.1/bin/pm2 /usr/bin/pm2
//////////////////////////////////////////////
g++ or c++ などが不足してることもあるので
sudo apt install build-essential
sudo apt install libssl-dev



```

## License
### Public domain
