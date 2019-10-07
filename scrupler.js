const puppeteer = require('puppeteer');

(async() => {
  // Запустим браузер
  const browser = await puppeteer.launch({
    args: ['--no-sandbox'] }
  );  // Откроем новую страницу
  const page = await browser.newPage();

  let channelName = 'tatmedia'; // получать из базы

  let linkBase = 'https://t.me/s/' + channelName;

  let lastId = 21713; // получать из базы
  let lastMsgId = channelName + '/' + lastId;

  let getPosts = async (link) => {
    const pageURL = link;
    
    try {
      await page.goto(pageURL);
      console.log(`Открываю страницу: ${pageURL}`);
    } catch (error) {
      console.log(`Не удалось открыть
        страницу: ${pageURL} из-за ошибки: ${error}`);
    }

    let result = await page.evaluate(() => {
      let data = []; // Создаём пустой массив для хранения данных
      let elements = Array.from(document.querySelectorAll('.tgme_widget_message_wrap')).reverse(); // все посты в обратном порядке (последние сообщения первые)

      for (let element of elements) { // Проходимся в цикле по каждому посту

        let id = element.firstChild.attributes["data-post"].value;
        let content = element.firstChild.children[1].querySelector('.tgme_widget_message_text').innerHTML;

        data.push({id, content}); // Помещаем объект с данными в массив
      }

      return data; // Возвращаем массив
    });
    return result;
  }

  let touchedLastMsgId = false;
  let allResults = [];
  let linkAddition = '';
  let newLastId = 0;

  while (!touchedLastMsgId) {

    let result = await getPosts(linkBase + linkAddition);

    if (newLastId == 0)
      newLastId = result[0].id.split('/')[1]; // сохранять в базу

    for (let i = 0; i < result.length; i++) {
      if (result[i].id == lastMsgId) {
        result.splice(i, result.length - 1);
        touchedLastMsgId = true;
        break;
      }
    }
    if (!touchedLastMsgId)
      linkAddition = `?before=${Number(result[result.length-1].id.split('/')[1])}`;

    allResults = allResults.concat(result);
  }


  function comparator(a, b) {
    return a.id > b.id ? 1 : -1;
  }
  allResults.sort(comparator);

  console.log(allResults);
  console.log(lastId);
  console.log(newLastId);

  await browser.close();
  
  process.exit();
})();