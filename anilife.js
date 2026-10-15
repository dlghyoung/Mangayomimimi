class Extension {
  constructor() {
    this.name = "AniLife";
    this.baseUrl = "https://anilife01.tv";
    this.lang = "ko";
    this.type = "anime";
  }

  getHeaders() {
    return {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": this.baseUrl + "/"
    };
  }

  async getPopular(page) {
    const res = await new Client().get(`${this.baseUrl}/anime?page=${page}`, this.getHeaders());
    const doc = new Document(res.body);
    const elements = doc.select(".anime-item, .item-card");
    const list = [];

    for (const el of elements) {
      const title = el.selectFirst(".title")?.text.trim() || "";
      const href = el.selectFirst("a")?.attr("href") || "";
      const cover = el.selectFirst("img")?.attr("src") || "";

      if (href) {
        list.push({
          name: title,
          link: href.startsWith("http") ? href : this.baseUrl + href,
          imageUrl: cover.startsWith("http") ? cover : this.baseUrl + cover
        });
      }
    }
    return { list, hasNextPage: list.length > 0 };
  }

  async getDetail(url) {
    const res = await new Client().get(url, this.getHeaders());
    const doc = new Document(res.body);
    const description = doc.selectFirst(".desc, .summary")?.text.trim() || "";
    const episodes = [];

    const epElements = doc.select(".episode-list a, .ep-item a");
    for (let i = 0; i < epElements.length; i++) {
      const el = epElements[i];
      const name = el.text.trim() || `Episode ${i + 1}`;
      const link = el.attr("href");
      episodes.push({
        name: name,
        url: link.startsWith("http") ? link : this.baseUrl + link
      });
    }

    return { description, episodes: episodes.reverse() };
  }

  async getVideoList(url) {
    const res = await new Client().get(url, this.getHeaders());
    const doc = new Document(res.body);
    let videoUrl = doc.selectFirst("iframe")?.attr("src") || doc.selectFirst("video source")?.attr("src");

    if (!videoUrl) {
      const match = res.body.match(/(https?:\/\/[^\s"'<>]+\.(m3u8|mp4))/i);
      if (match) videoUrl = match[1];
    }

    if (!videoUrl) return [];

    return [{
      url: videoUrl,
      quality: "Auto / 1080p",
      originalUrl: url,
      headers: this.getHeaders()
    }];
  }
}
