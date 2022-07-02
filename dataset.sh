# User login
curl 0.0.0.0/api/rpc/login -c .session --data 'id=admin&pass=admin'
# lesson creation + cascade delete
curl -b .session -XDELETE 0.0.0.0/api/lesson
curl -b .session 0.0.0.0/api/lesson -d title="curl created" -d content="this lesson was created via curl"
curl -s 0.0.0.0/api/lesson | jq '. | length' # 1
# populate database from lessons files
for f in media/*.md ; do
    printf "\ndeploy $f ...\n"
    TITLE=$(sed -n 's/title: //p' $f)
    TAGS=$(sed -n 's/tags: //p' $f)
    DATE=$(sed -n 's/created: //p' $f)
    curl -b .session 0.0.0.0/api/lesson -d "tags=$TAGS" -d "title=$TITLE" -d "content=$(sed '1{/^---$/!q;};1,/^---$/d' $f)"
done