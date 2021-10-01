## PORTAL-RUNNER
blue-green update solution for IASA-PORTAL
### Usage
0. connect to continaer
```shell
ssh -i "portal_2.pem" ec2-user@ec2-3-36-139-74.ap-northeast-2.compute.amazonaws.com
```
1. install requirements
```shell
curl -s https://raw.githubusercontent.com/IASA-Null/PORTAL-RUNNER/master/install.sh | sudo bash /dev/stdin
```
2. login to docker
```shell
docker login --username=clubnull --password=$DOCKER_PASSWORD
```
3. run docker container
```shell
docker run -p 8080:8080 -v /var/run/docker.sock:/var/run/docker.sock clubnull/portal:runner
```
