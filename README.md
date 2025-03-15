# Discuss Create Revisit (~~coursework 2023~~ diplomawork 2025)

> [!NOTE]
> Для дипломної роботи цей веб-застосунок скоро буде розширено новим функціоналом

Веб-застосунок для відеоконференцій з системою багатьох дошок.
Основана на WebRTC та бібліотеці [Mediasoup](https://mediasoup.org/).

---

## Встановлення

Через HTTPS::
```
git clone https://github.com/Xeltalliv/discuss-create-revisit.git
cd discuss-create-revisit
```

Через SSH:
```
git clone git@github.com:Xeltalliv/discuss-create-revisit.git
cd discuss-create-revisit
```

Підготовка клієнта:
```
cd client
npm install
npm run build
```
Підготовка сервера:
```
cd server
npm install
```
Налаштуйте сервер в `config.json`

---

## Запуск
Запуск WebSocket+WebRTC сервера:
```
cd server
npm start
```
Запуск веб-сервера статичнийх файлів для розробки:
```
cd client
npm run devserver
```

---

## Вимоги
Node v20.10.0  
Python 3.12.1  
git  

---

## Основано на
[WebRTC: mediasoup (SFU) hands on - Part 2](https://www.youtube.com/watch?v=FLxU6ftLJsE) від [Amir Eshaq](https://www.youtube.com/@amireshaq)