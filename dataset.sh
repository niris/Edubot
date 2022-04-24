# User (re)creation
curl -XDELETE 0.0.0.0/api/lesson
curl -XDELETE 0.0.0.0/api/user/admin || : # delete if any admin exist
curl 0.0.0.0/api/user -d id=admin -d 'roles={admin,teacher,user}'
curl 0.0.0.0/api/user -d id=test -d 'roles={teacher,user}'
# lesson creation + cascade delete
curl 0.0.0.0/api/lesson -d title=hello -d content="how to use edubot" -d owner=admin
curl 0.0.0.0/api/lesson -d title=hello -d content="cascade test" -d owner=test
curl -XDELETE 0.0.0.0/api/user/test
echo -n only 1 example lesson shall remain:
curl -s 0.0.0.0/api/lesson | jq '. | length'
# populate database from lessons files
for f in media/*.md ; do
    TITLE=$(sed -n 's/title: //p' $f)
    TAGS=$(sed -n 's/tags: //p' $f)
    DATE=$(sed -n 's/created: //p' $f)
    curl 0.0.0.0/api/lesson -d owner=admin -d "tags=$TAGS" -d "title=$TITLE" -d "content=$(sed '1{/^---$/!q;};1,/^---$/d' $f)"
done