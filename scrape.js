const cluster = require("cluster");
const numCPUs = require("os").cpus().length;
const puppeteer = require("puppeteer");
const ProxyChain = require("proxy-chain");
const fs = require("fs");

if (cluster.isMaster) {
  // Master process

  // Fork worker processes
  // Change the number of CPUs to your
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Handle worker exit
  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    // You can handle worker failure here and decide whether to restart it or take other actions
  });
} else {
  // Connect to a database of your preference
  // MongoDB database connection
  let dbUrl = "";
  mongoose
    .connect(`mongodb://${dbUrl}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB connected"))
    .catch((error) => console.error("MongoDB connection error:", error));

  // Id of the page you want to test scrape it
  // best to make it dynamic on your database so you may scrape it sequentially
  let id = 2186;
  // Define a list of proxy servers with ports
  const proxyServers = [
    "46.182.6.51:3129",
    "65.109.136.109:8080",
    "153.101.67.170:9002",
  ];

  // Function to perform the scraping task
  const scrapeWebsite = async () => {
    // Select a random proxy server for IP rotation
    // const randomProxy =
    //   proxyServers[Math.floor(Math.random() * proxyServers.length)];

    // Create a new proxy URL with ProxyChain
    // const proxyUrl = await ProxyChain.anonymizeProxy(`http://${randomProxy}`);

    // Configure Puppeteer to use the proxy server
    const browser = await puppeteer.launch({
      headless: "new",
      // args: [`--proxy-server=${proxyUrl}`],
    });

    const page = await browser.newPage();
    // URL of the page you want to iterate and scrape.
    await page.goto("https://" + id);
    // Extract data from the page using Puppeteer
    const restaurantResults = await page.$eval(
      "#__NEXT_DATA__",
      (result) => result.text
    );
    // const restaurantResults = await page.$eval("div", (result) => result.text);
    console.log(restaurantResults);
    if (restaurantResults) {
      fs.writeFile(`./data/${id}.json`, restaurantResults, function (err) {
        if (err) {
          return console.log(err);
        }
        console.log("The file was saved! " + id);
      });
      //Add logic here to change the id status in your database
    }
    await browser.close();
  };

  // Function to initiate scraping at the specified interval
  const startScraping = () => {
    scrapeWebsite(); // Execute the scraping task immediately

    // Set the interval for the scraping task (5 minutes = 300,000 milliseconds)
    // This task is to no exhaust the target server.
    setInterval(() => {
      scrapeWebsite();
    }, 300000);
  };

  // Start the scraping process
  startScraping();
}
