class SportsWidget {
  constructor(sport, group, lang) {
    this.sport = sport;
    this.group = group;
    this.lang = lang;
    this.channel = this.sport + ':' + this.group + ':' + this.lang;
    this.socket = io();

    console.log('channel')
    console.log(this.channel);
    let div = document.createElement('div');
    div.id = this.channel;
    // div.className = 'scoreboard'
    document.body.appendChild(div);

  }

  connect() {
    console.log('connect');
    const data = {
      action: 'subscribe',
      channel: this.channel,
      sport: this.sport,
      group: this.group,
      lang: this.lang
    };
    this.socket.emit('joinRoom', data);
    this.socket.onopen = () => {
      console.log('Connected to server');
      const data = {
        action: 'subscribe',
        channel: this.channel,
        sport: this.sport,
        group: this.group,
        lang: this.lang
      };

      // this.socket.send(JSON.stringify(data));
      socket.emit('joinRoom', data);
    };

    this.socket.on('updateFeed', ({ feed }) => {
      // console.log(feed);
      // const message = mymessage;
      // console.log(this.channel)
      document.getElementById(this.channel).innerHTML = '<h1>' + this.sport.toUpperCase() + '</h1>';
      Object.keys(feed).forEach((key) => {
        const data = feed[key];
        this.populateGames(data, this.channel);
      });
    });
  }

  populateGames(data, container) {
    let template = `
      <div class="s_bode">
    <div class="home_section">
      <img class="homeLogo" src="https://www.freepnglogos.com/uploads/manchester-united-logo-png/manchester-united-logo-football-logos-vector-eps-cdr-svg-download-7.png" alt="">
      <h2 class="homeTeam">Manchester United<span>(win)</span></h2>
      <div class="mid_section">
        <h1><span class="homeScore">3</span> - <span class="awayScore">2</span></h1>
      </div>
      <div class="away_section">
        <img class="awayLogo" src="https://www.freepnglogos.com/uploads/barcelona-png/barcelona-new-crest-png-sinastf-deviantart-1.png" alt="">
        <h2 class="awayTeam">FC Barcelona <span>(Loss)</span></h2>
      </div>
    </div>
  </div>
  <br><br>
    `;

    const populatedTemplate = this.populateTemplate(data, template);
    document.getElementById(container).appendChild(populatedTemplate);
  }

  populateTemplate(data, template) {
    const templateElement = document.createElement('template');
    templateElement.innerHTML = template;

    templateElement.content.querySelector('.homeTeam').textContent = data['homeTeam'];
    templateElement.content.querySelector('.homeScore').textContent = data['homeScore'];
    templateElement.content.querySelector('.awayScore').textContent = data['awayScore'];
    templateElement.content.querySelector('.awayTeam').textContent = data['awayTeam'];
    templateElement.content.querySelector('.homeLogo').setAttribute('src', 'https://api.mfeedbo.com/api/m88feed/getteamicon/' + data['homeTeamIcon']);
    templateElement.content.querySelector('.awayLogo').setAttribute('src', 'https://api.mfeedbo.com/api/m88feed/getteamicon/' + data['awayTeamIcon']);
    return templateElement.content;
  }
}

