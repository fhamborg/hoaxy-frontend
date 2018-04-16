
configuration = function(){

	var obj = {} 

	var mashape_key = "BaqsVW3OeZmshiWkpF0BpsJk3yvap1PcHTJjsn9YZuQSkXh3oJ";
	var proxy_secret = "F195eMAQ1q9m6de5n599VM3SYG4lGdYrCm0rF6F6we7e4EeuCf";

	obj.articles_url = "https://api-hoaxyde.p.mashape.com/articles";
	obj.articles_headers = {
		"X-Mashape-Key": mashape_key,
		"X-Mashape-Proxy-Secret": proxy_secret,
		"Accept": "application/json"
	};

	obj.timeline_url =  "https://api-hoaxyde.p.mashape.com/timeline";
	obj.timeline_headers = {
		"X-Mashape-Key": mashape_key,
		"X-Mashape-Proxy-Secret": proxy_secret,
		"Accept": "application/json"
	};

	obj.network_url = "https://api-hoaxyde.p.mashape.com/network";
	obj.network_headers = {
		"X-Mashape-Key": mashape_key,
		"X-Mashape-Proxy-Secret": proxy_secret,
		"Accept": "application/json"
	};

	obj.top_articles_url = 'https://api-hoaxyde.p.mashape.com/top-articles';
	obj.top_articles_headers = { 'X-Mashape-Key': mashape_key};

	obj.top_users_url = 'https://api-hoaxyde.p.mashape.com/top-users';
	obj.top_users_headers = { 'X-Mashape-Key': mashape_key};


	return obj;
}();