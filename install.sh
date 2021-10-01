sudo cat <<EOF >/etc/yum.repos.d/mongodb-org-5.0.repo
[mongodb-org-5.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/amazon/2/mongodb-org/5.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-5.0.asc
EOF
sudo yum update -y
sudo yum install -y mongodb-org
sudo systemctl start mongod
sudo systemctl status mongod
sudo systemctl enable mongod
mongo <<EOF
use admin;
db.createUser({user: 'portal', pwd: 'iasa2020!', roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase", "readWriteAnyDatabase"]})
EOF
sudo amazon-linux-extras install docker
sudo service docker start
sudo usermod -a -G docker ec2-user
sudo systemctl enable docker.service
sudo systemctl enable containerd.service
curl -s https://raw.githubusercontent.com/IASA-Null/PORTAL-RUNNER/master/account.json | mongoimport --db iasa_portal --collection account --file /dev/stdin --jsonArray
