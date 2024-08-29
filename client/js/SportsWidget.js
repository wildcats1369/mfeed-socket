class SportsWidget {
  constructor(sport, group, lang, display = 'scoreboard', container = 'container',) {
    this.sport = sport;
    this.group = group;
    this.lang = lang;
    this.display = display;
    this.container = container;
    this.channel = this.sport + ':' + this.group + ':' + this.lang;
    this.socket = io('localhost:3000');
    this.data = {};
    this.feed = {};

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

      this.feed = feed
      switch (this.display) {
        case 'scoreboard':
          this.displayScoreBoards(data, this.channel);
          break;
        case 'tabs':
          this.displayTabs(this.channel);
          break;
        case 'tournament':
          this.displayTournament(this.container);
          break;
      }

      let group = this.groupData(this.feed);

    });
  }

  displayTournament(container) {

    let mycontainer = document.getElementById(this.container);
    mycontainer.innerHTML = '';

    if (this.feed) {
      let tournament_header = document.createElement('div');
      let tournament_container = document.createElement('div');
      tournament_container.className = 'tournament-container';
      tournament_header.className = 'tournament-header';
      tournament_header.innerHTML = `
    <img src="img/tournament-title1.png" alt="Primera Nacional">
    <h2>Primera Nacional Argentina</h2>
    `;
      tournament_container.appendChild(tournament_header);

      let matches = this.feed;
      let matches_container = document.createElement('div');
      matches_container.className = 'matches-container';
      mycontainer.appendChild(matches_container);


      if (matches.length > 0) {
        Object.keys(matches).forEach((key) => {
          let data = matches[key];
          let match = document.createElement('div');
          match.className = 'tournament-match-card';
          match.innerHTML = `
                <div class="tournament-match-details">
                    <img src="https://api.mfeedbo.com/api/m88feed/getteamicon/` + data['homeTeamIcon'] + `" alt="` + data['homeTeam'] + `">
                    <div class="tournament-team">` + data['homeTeam'] + `</div>
                </div>
                <div class="tournament-match-info">
                    <div class="tournament-match-date">`+ this.getLocalDate(data['date']) + `</div>
                    <div class="tournament-match-time">`+ this.getLocalTime(data['date']) + `</div>
                </div>
                <div class="tournament-match-details">
                    <img src="https://api.mfeedbo.com/api/m88feed/getteamicon/` + data['awayTeamIcon'] + `" alt="` + data['awayTeam'] + `">
                    <div class="tournament-team">` + data['awayTeam'] + `</div>
                </div>
        `;

          matches_container.appendChild(match);

        });
      } else {
        matches_container.innerHTML = 'Data is Empty';
      }

      tournament_container.appendChild(matches_container);
      mycontainer.innerHTML = tournament_container.innerHTML

    } else {
      mycontainer.innerHTML = 'Data is Empty';
    }
  }


  displayTabs(container) {
    if ($('#' + this.container).tabs('instance')) {
      $('#' + this.container).tabs('destroy');
    }

    let mycontainer = document.getElementById(this.container);
    mycontainer.innerHTML = '';
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
    $('#' + this.container).tabs({
      classes: {
        "ui-tabs": "",
        "ui-tabs-nav": "",
        "ui-tabs-tab": "",
        "ui-tabs-panel": "",
        "ui-tabs-active": ""
      }
    });
  }

  generateTabs(data, div) {
    div.innerHTML = '';
    let tab = document.createElement('ul');
    Object.keys(data).forEach((key) => {
      let li = document.createElement('li');
      let id = "tab-" + key
      li.className = 'tab'
      let content = `<a href="#${id}">${this.ucwords(key)}</a></li>`;
      li.innerHTML = content;
      tab.appendChild(li);
    });
    div.appendChild(tab);

    Object.keys(data).forEach((key) => {
      let cdiv = document.createElement('div');

      cdiv.id = "tab-" + key
      let content = this.generateTabContent(data[key]);
      cdiv.innerHTML = content.innerHTML;
      div.appendChild(cdiv);
    });
  }

  generateTabContent(data) {

    let tabcontent = document.createElement('div');
    tabcontent.className = 'scoreboard';

    Object.keys(data).forEach((key) => {

      let event = document.createElement('div');
      event.innerHTML = ''
      event.className = 'event';
      let event_header = document.createElement('div');
      event_header.className = 'event-header';
      const league_icon = data[key][0]['tIconLight'];
      event_header.innerHTML = `
        <img src = "https://api.mfeedbo.com/api/m88feed/getleagueicon/`+ league_icon + ` " alt = "Country Flag" class="flag">
          <span class="event-name">`+ data[key][0]['tournament'] + `</span>
        `
      event.appendChild(event_header);
      let matches = data[key];
      let event_matches = document.createElement('div');
      event_matches.className = 'matches';

      Object.keys(matches).forEach((key) => {
        let match = document.createElement('div');
        match.className = 'match';
        match.innerHTML = `<div class="time">` + this.getLocalTime(matches[key]['date']) + `</div>
        <div class="team">`+ matches[key]['homeTeam'] + `</div>
        <div class="score">`+ matches[key]['homeScore'] + ` - ` + matches[key]['awayScore'] + `</div>
        <div class="team">`+ matches[key]['awayTeam'] + `</div>`
        event_matches.appendChild(match);

      });
      event.appendChild(event_matches);

      // Add matches
      // Add to tab content
      tabcontent.appendChild(event);

    });

    return tabcontent;
  }

  getLocalDate(dateString) {

    // Parse the date string into a Date object
    let date = new Date(dateString);

    // Get the visitor's local timezone offset in minutes
    let timezoneOffset = date.getTimezoneOffset();

    // Convert the date to the visitor's local timezone
    let localDate = new Date(date.getTime() - (timezoneOffset * 60000));

    // Format the date and time
    let options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    let formattedDate = localDate.toLocaleString('en-US', options);

    return formattedDate;
  }

  getLocalTime(dateString) {

    // Parse the date string into a Date object
    let date = new Date(dateString);

    // Get the visitor's local timezone offset in minutes
    let timezoneOffset = date.getTimezoneOffset();

    // Convert the date to the visitor's local timezone
    let localDate = new Date(date.getTime() - (timezoneOffset * 60000));

    // Format the date and time
    let options = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    };
    let formattedDate = localDate.toLocaleString('en-US', options);

    return formattedDate;
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
    const formatDate = (date) => date.toISOString().split('T')[0];

    const todayStr = formatDate(today);

    const categorizedData = {
      previous: {},
      today: {},
      upcoming: {},
      live: {}
    };

    data.forEach(match => {
      let match_tournament = match.tournament;

      const matchDate = new Date(match.date);
      const matchDateStr = formatDate(matchDate);
      let category;

      if (matchDateStr === todayStr) {
        category = 'today';
      } else if (matchDate < today) {
        category = 'previous';
      } else {
        category = 'upcoming';
      }

      if (match.isLive == 1) {
        category = 'live';
      }

      if (categorizedData[category] && categorizedData[category][match_tournament]) {

      } else {
        categorizedData[category][match_tournament] = [];
      }
      categorizedData[category][match_tournament].push(match);


    });

    return categorizedData;
  }


  slugify(str) {
    return str
    // .toLowerCase() // Convert to lowercase
    // .trim() // Remove leading and trailing whitespace
    // .replace(/[^a-z0-9 .-]/g, '') // Remove non-alphanumeric characters except dots and hyphens
    // .replace(/\s+/g, '-') // Replace spaces with hyphens
    // .replace(/-+/g, '-'); // Remove consecutive hyphens
  }
  ucwords(str) {
    return str.toLowerCase().replace(/\b\w/g, function (char) {
      return char.toUpperCase();
    });
  }
}








