const fs = require('fs');
const Crawler = require('crawler');
const data = [];
const stringify = require('csv-stringify');

const prependZeroIfNecessary = (number) => {
    if (number < 10) {
        return '0' + number;
    }

    return number;
};

const getCsvFileName = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = prependZeroIfNecessary(date.getMonth() + 1);
    const day = prependZeroIfNecessary(date.getDate());

    return `${year}-${month}-${day}.csv`;
};

const ensureDataDirectoryExists = () => {
    if (!fs.existsSync('./data')) {
        fs.mkdirSync('./data');
    }
}

const createCrawler = (url, handler) => { 
    const crawler = new Crawler({
        maxConnections: 10,
        // This will be called for each crawled page
        callback: (error, res, done) => {
            if (error) {
                console.log(error);
            } else{
                handler(res.$);
            }
    
            done();
        }
    });
     
    // Queue just one URL, with default callback
    crawler.queue(url);
};

const pushAnchorInfoToData = ($) => {
    $('.products > li > a').each(function () {
        const $img = $(this).find('img');

        data.push({
            url: $(this).attr('href'),
            image: $img.attr('src'),
            title: $img.attr('alt'),
        });
    });
};

const crawlPriceFromData = (callback) => {
    let callbacksRemaining = data.length;

    data.forEach(each => {
        createCrawler('http://shirts4mike.com/' + each.url, ($) => {
            each.price = $('.price').text();
            callbacksRemaining -= 1;

            if (callbacksRemaining === 0) {
                callback();
            }
        });
    });
};

const writeDataToCsv = () => {
    const time = (new Date()).toUTCString();
    const header = [
        'Title', 'Price', 'ImageURL', 'URL', 'Time',
    ];

    stringify([
        header,
    ].concat(data.map(each => [
        each.title,
        each.price,
        each.image,
        each.url,
        time,
    ])), function(err, output){
        fs.writeFileSync('./data/' + getCsvFileName(), output);
    });      
};

const handleCrawlerResult = ($) => {
    pushAnchorInfoToData($);
    crawlPriceFromData(writeDataToCsv);
};

ensureDataDirectoryExists();
createCrawler('http://shirts4mike.com/shirts.php', handleCrawlerResult);