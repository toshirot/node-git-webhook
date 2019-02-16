# node-git-webhook
git-webhook by Node.js

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

1) 対象サーバーのパス例
```
    pathTo/
        └── example.net
                ├── html     
                ├── server
                └── etc..
```
2) github > settings > WebHook の Payload URL に
```
　  https://<HOST名>:<PORT名>
```
3) github > settings > WebHook の Content type
```
    application/json
```
4) github > settings > WebHook の Secret
```
    conf.js に書いたのと同じシークレット
```
5) github > settings > WebHook の SSL verification
```
    今時は、✔️Enable SSL verification  要WebのSSL設定
```
6) github > settings > WebHook の Which events would you like to trigger this webhook?
```
    このWebhookをトリガーしたいイベントはどれですか？
    ✔️Just the push event.
```
7) github > settings > WebHook の Active
```
    ✔️Active
```
8) ssh-keygenで秘密鍵、公開鍵を作る
```
    sudo ssh-keygen -t rsa -b 4096 -C "Your@e-mail"  -f /root/.ssh/id_rsa_github_example.net
```
    これで 
```
    /root/.ssh/id_rsa_github_example.net 秘密鍵
    /root/.ssh/id_rsa_github_example.net.pub　公開鍵
```
    が生成される
```
    この公開鍵を github settings > Deploy keys へ追加する
```
    
9) プライベートリポジトリの場合は、.ssh/configに鍵のパスを登録しておく
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
## 起動とデーモン

pm2やforeverなどでgit-hook.jsを起動します。
sslの鍵にroot権限が必要なので sudo で動かしています。

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
/home/tato/nvm/versions/node/v10.15.1/bin/node
$ which pm2
/home/tato/nvm/versions/node/v10.15.1/bin/pm2

wssをrootで実行するためにリンクを張っておく
sudo ln -s /home/hoge/nvm/versions/node/v10.15.1/bin/node /usr/bin/node
sudo ln -s /home/hoge/nvm/versions/node/v10.15.1/bin/pm2 /usr/bin/pm2
//////////////////////////////////////////////
g++ or c++ などが不足してることもあるので
sudo apt install build-essential
sudo apt install libssl-dev



```

## License
Public domain
