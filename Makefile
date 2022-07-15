HOST?=0.0.0.0
setup: ; curl -s --fail $(HOST)/api/lesson || docker ps -f name=postgres --format {{.Names}} | xargs -I@ docker exec -i @ psql -f sql/schema.sql
.session: ; curl $(HOST)/api/rpc/login -c $@ --data 'id=admin&pass=admin'
logout:.session; rm $<
test:  .session; curl -b $< $(HOST)/api/lesson -d title="curl created" -d content="this lesson was created via curl"
purge: .session; curl -b $< -XDELETE $(HOST)/api/lesson
deploy:.session;
	for f in dataset/lesson/*.md dataset/vocab/*.md ; do\
	    TITLE=$$(sed -n 's/title: //p' $$f);\
	    TAGS=$$(sed -n 's/tags: //p' $$f);\
	    DATE=$$(sed -n 's/created: //p' $$f);\
	    printf "\ndeploy $$f ($$TITLE $$TAGS) ...\n";\
	    sed '1{/^---$$/!q;};1,/^---$$/d' $$f | curl -b .session $(HOST)/api/lesson -d "tags=$$TAGS" -d "title=$$TITLE" --data-urlencode content@-;\
	done;