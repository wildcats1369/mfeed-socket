class SportsWidget {
  constructor(sport, group, lang, display = 'scoreboard', container = 'container',) {
    this.sport = sport;
    this.group = group;
    this.lang = lang;
    this.display = display;
    this.container = container;
    this.channel = this.sport + ':' + this.group + ':' + this.lang;
    this.socket = io('http://localhost:3000');
    this.data = {};
    this.feed = {};

    console.log('channel')
    console.log(this.channel);


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
      this.feed = feed
      switch (this.display) {
        case 'scoreboard':
          this.displayScoreBoards(data, this.channel);
          break;
        case 'tabs':
          this.displayTabs(this.channel);
          break;
      }

      let group = this.groupData(this.feed);
      console.log(group)
      console.log(group['yesterday']);
      console.log(group['today']);
      console.log(group['tomorrow']);
    });
  }

  displayTabs(container) {
    console.log('container: ' + container);
    let mycontainer = document.getElementById(this.container);
    let data = this.groupData(this.feed);

    let id = 'tabs-' + this.channel;
    let element = document.getElementById(id);
    let div;
    if (!element) {
      div = document.createElement('div');
      div.id = id;
    } else {
      div = element;
    }
    // mycontainer.appendChild(div);
    this.generateTabs(data, mycontainer)
    $('#' + this.container).tabs();
  }

  generateTabs(data, div) {

    let tab = document.createElement('ul');
    Object.keys(data).forEach((key) => {
      let li = document.createElement('li');
      let id = "tab-" + key
      let content = `<a href="#${id}">${key}</a></li>`;
      li.innerHTML = content;
      tab.appendChild(li);
    });
    div.appendChild(tab);

    Object.keys(data).forEach((key) => {
      let cdiv = document.createElement('div');

      cdiv.id = "tab-" + key
      let content = JSON.stringify(data[key]);
      cdiv.innerHTML = `<p>${content}</p>`;
      div.appendChild(cdiv);
    });
  }



  displayScoreBoards(container) {
    let id = 'scoreboards-' + this.channel;
    let element = document.getElementById(id);
    let div;

    if (!element) {
      div = document.createElement('div');
      div.id = id;
      document.body.appendChild(div);
    } else {
      div = element;
    }


    div.innerHTML = '<h1>' + this.sport.toUpperCase() + '</h1>';
    Object.keys(this.feed).forEach((key) => {
      let data = this.feed[key];
      this.populateGames(data, id);
    });

    let fragment = document.createDocumentFragment();
    fragment.appendChild(div);

    container = document.getElementById(this.container);
    container.innerHTML = fragment.firstChild.outerHTML;

    // Return the HTML of the fragment
    return fragment.firstChild.outerHTML;
  }


  populateGames(data, container) {
    console.log(container);
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


  groupData(data) {
    const today = new Date();
    const yesterday = new Date(today);
    const tomorrow = new Date(today);

    yesterday.setDate(today.getDate() - 1);
    tomorrow.setDate(today.getDate() + 1);

    const formatDate = (date) => date.toISOString().split('T')[0];

    const todayStr = formatDate(today);
    const yesterdayStr = formatDate(yesterday);
    const tomorrowStr = formatDate(tomorrow);

    const categorizedData = {
      history: {},
      yesterday: {},
      today: {},
      tomorrow: {},
      upcoming: {}
    };

    data.forEach(match => {
      const matchDate = match.date.split('T')[0];
      let category;

      if (matchDate === yesterdayStr) {
        category = 'yesterday';
      } else if (matchDate === todayStr) {
        category = 'today';
      } else if (matchDate === tomorrowStr) {
        category = 'tomorrow';
      } else if (new Date(matchDate) < yesterday) {
        category = 'history';
      } else {
        category = 'upcoming';
      }

      if (!categorizedData[category]) {
        categorizedData[category] = {};
      }

      if (!categorizedData[category][match.tournament]) {
        categorizedData[category][match.tournament] = [];
      }

      categorizedData[category][match.tournament].push(match);
    });

    return categorizedData;
  }
}








