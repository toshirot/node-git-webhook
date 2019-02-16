# node-git-webhook
git-webhook by Node.js

github リポジトリへのpushなどだけでサーバー側に自動デプロイする。
これは、例えば example.netというレポジトリのdev-2fブランチへのpushをすると
サーバー側の /pathTo/example.net 以下の内容を git からpull して更新する。

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
