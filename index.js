var http = require("https");
http = require('follow-redirects').http;
var fs = require('fs');
//var HttpsProxyAgent = require('https-proxy-agent');
//var agent = new HttpsProxyAgent('http://proxy:8080');

const topicId = '30556056';
const authToken = '';

var topicPath = "/api/v1/messages/about_topic/"+topicId+".json";
var threadPath = "/api/v1/threads/";
var downloadPath = "/api/v1/uploaded_files/";

var options = {
  "method": "GET",
  "hostname": "www.yammer.com",
  "port": null,
  "path": "/api/v1/users.json",
  "headers": {
    "authorization": "Bearer "+authToken,
    "cache-control": "no-cache"
  },
//  "agent":agent,
  "followRedirect": true
};

//var writer = csvWriter();
//writer.pipe(fs.createWriteStream('./followers.csv'));

//1. Get thread id from messages by using /topic
//2. Get each thread and look for image to download

getMessageFromTopic((messages) => {
    getThreadsFromMessages( messages,
			 (thread) => {
			     
			     downloadImageFromThread(thread);
			     
			 },
			 (threads) => {
			
			 }
		       );
});

async function downloadImageFromThread(thread){

    if(!thread)
	return;

    const refs = thread.references?thread.references:null;

    if(!refs)
	return;

    for(var ref, i=0; ref=refs[i]; i++)
    {
	if(ref.type == 'image'){
	    //download
	    await download(ref.id+".jpg", ref.id, ()=>{});
	}
    }
}

function download(filename, id, cb){
    var file = fs.createWriteStream(filename);
    options.path = downloadPath+id+'/download';
    var request = http.request(options, function(response) {
	response.pipe(file);
	file.on('finish', function() {
	    file.close(cb);
	});
    }).end();
}

async function getThreadsFromMessages(msgs, eachCb, cb){

    var threads = [];
    for( var msgs, i=0; msg = msgs[i]; i++)
    {
	options.path = threadPath + msg.thread_id + '.json';
	var retThread = await makeThreadRequest(options, msg.thread_id);
	threads = threads.concat( retThread  );
	eachCb(retThread);
	await sleep(3000);
    }
    cb(threads);
}

function makeThreadRequest(options, userId){
    return new Promise(resolve => {
	
	http.request(options, function (res) {
	    //console.log(options);
    	    var chunks = [];
    	    res.on("data", function (chunk) {
    		chunks.push(chunk);
    	    });

    	    res.on("end", function () {
    		var body = Buffer.concat(chunks);
		var d  = JSON.parse(body.toString());
		var dLen = d.length;
		
 		// d.users.forEach(function(item){
		//     followers.push({'id' : userId,'followerId' : item.id  });
		//     //console.log({'id' : userId,'followerId' : item.id  });
		// });
		resolve(d);
		
    	    });
	}).end();
    });
}

async function getMessageFromTopic(cb){

    var iPage = 0;
    var msgs = []; //{id: , email: }
    options.path = topicPath;

   do{
	options.path = iPage > 0?topicPath + "?older_than=" + iPage:options.path;
	//++iPage;	    
	var retMsgs = [];
	console.log(options.path);
	retMsgs = retMsgs.concat(await makeTopicRequest(options));
	msgs =  msgs.concat(retMsgs);
	iPage = msgs[msgs.length-1].id;
	await sleep(3000);
    }while(retMsgs.length > 0);

    cb(msgs);
}

function makeTopicRequest(options){

    return new Promise(resolve => {
	var msgs = [];
	http.request(options, function (res) {
	    //console.log(options);
    	    var chunks = [];
    	    res.on("data", function (chunk) {
    		chunks.push(chunk);
    	    });

    	    res.on("end", function () {
    		var body = Buffer.concat(chunks);
		var d  = JSON.parse(body.toString());
		d = d.messages?d.messages:d;
		var dLen = d.length;
		

		for(var idx=0; idx<dLen; idx++){
		    msgs.push({ id: d[idx].id, thread_id: d[idx].thread_id });
		    //console.log(d[idx].id);		    
		}
		resolve(msgs);
		
    	    });
	}).end();	
    });
}


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

