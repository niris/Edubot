HOST?=0.0.0.0
psql:          ; docker exec -ti $(shell docker ps -f name=postgres --format {{.Names}}) psql ; docker ps -f name=postgres --format {{.Names}} | xargs -I@ docker exec -i @ psql -c "NOTIFY pgrst, 'reload schema';"
db_drop:       ; docker-compose down ; sudo rm -rf ./pgdata/ ; docker-compose up -d ; sleep 3
db_init:       ; docker ps -f name=postgres --format {{.Names}} | xargs -I@ docker exec -i @ psql -f sql/schema.sql
.a:            ; curl $(HOST)/api/rpc/login -c $@ --data 'id=teacher&pass=teacher'
logout_admin:.a; rm $<
lesson_trunc:.a; curl -b $< -XDELETE $(HOST)/api/lesson
lesson_init :.a;
	for f in dataset/lesson/*.md dataset/vocab/*.md ; do\
	    TITLE=$$(sed -n 's/title: //p' $$f);\
	    TAGS=$$(sed -n 's/tags: //p' $$f);\
	    ICON=$$(sed -n 's/icon: //p' $$f);\
	    DATE=$$(sed -n 's/created: //p' $$f);\
	    printf "\ndeploy $$f ($$TITLE $$TAGS) ...\n";\
	    sed '1{/^---$$/!q;};1,/^---$$/d' $$f | curl -b $< $(HOST)/api/lesson -d "tags=$$TAGS" -d "title=$$TITLE" -d "icon=$$ICON" --data-urlencode content@-;\
	done;
test:  .a
	curl -b $< $(HOST)/api/lesson -d title="curl created" -d content="this lesson was created by teacher via curl"