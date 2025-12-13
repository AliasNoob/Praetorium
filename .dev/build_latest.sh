docker build -t pawelmalak/praetorium -t "pawelmalak/praetorium:$1" -f .docker/Dockerfile . \
  && docker push pawelmalak/praetorium && docker push "pawelmalak/praetorium:$1"