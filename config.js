
configuration = function(){
	var obj = {}

	
	// mashapi token from https://github.com/fhamborg/hoaxy
	// 							BaqsVW3OeZmshiWkpF0BpsJk3yvap1PcHTJjsn9YZuQSkXh3oJ
	// X-Mashape-Proxy-Secret: 	F195eMAQ1q9m6de5n599VM3SYG4lGdYrCm0rF6F6we7e4EeuCf

	var mashape_key = "BaqsVW3OeZmshiWkpF0BpsJk3yvap1PcHTJjsn9YZuQSkXh3oJ";

	obj.articles_url = "https://api-hoaxy.p.mashape.com/articles";
	obj.articles_headers = {
		"X-Mashape-Key": mashape_key,
		"Accept": "application/json"
	};

	obj.timeline_url =  "https://api-hoaxy.p.mashape.com/timeline";
	obj.timeline_headers = {
		"X-Mashape-Key": mashape_key,
		"Accept": "application/json"
	};

	obj.network_url = "https://api-hoaxy.p.mashape.com/network";
	obj.network_headers = {
		"X-Mashape-Key": mashape_key,
		"Accept": "application/json"
	};

	obj.top_articles_url = 'https://api-hoaxy.p.mashape.com/top-articles';
	obj.top_articles_headers = { 'X-Mashape-Key': mashape_key};

	obj.top_users_url = 'https://api-hoaxy.p.mashape.com/top-users';
	obj.top_users_headers = { 'X-Mashape-Key': mashape_key};


	return obj;
}();
