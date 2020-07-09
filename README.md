# standupg

i'm bad at writing standup messages, but i'm good at coding a script that does this for me.

### installation

```
npm -g install standupg
```

### pre-configuration

#### calendar

to be able to fetch gcal events, you need to create a google app with permissions to read your calendar. to do so:

- go to https://console.cloud.google.com/home/dashboard
- create a new project
- configure oauth consent screen
- get client-id and client-secret

#### github

to be able to fetch PRs, you need to create a personal token with repo read permissions on https://github.com/settings/tokens

### configuration

the package should have created a file in `~/.standup/config` with a skeleton config file.

you should edit this before running the script the first time.

| name                         | description                                           | defval |
| ---------------------------- | ----------------------------------------------------- | ------ |
| GITHUB_TOKEN                 | a personal github/ghe access token to access the PRs  | `null` |
| GITHUB_USER                  | your github username                                  | `null` |
| GITHUB_BASE                  | optional ghe base url to use instead of github.com    | `null` |
| GITHUB_OWNER                 | repo owner where to look for prs                      | `null` |
| GITHUB_REPO                  | repo name where to look for prs                       | `null` |
| GITHUB_VALID_LABELS          | pr labels to transpose in the message                 | `null` |
| GOOGLE_CLIENT_ID             | google app client-id used to fetch events             | `null` |
| GOOGLE_CLIENT_SECRET         | google app client-secret used to fetch events         | `null` |
| GOOGLE_EMAIL                 | your google email used to filter attendees            | `null` |
| GOOGLE_EMAIL                 | your google email                                     | `null` |
| CALENDAR_MAX_ATTENDEES_SHOWN | max number of attendes shown in the event description | 3      |
| CALENDAR_ATTENDEES_ALIAS     | JSON object to use as attendees alias mapping         | `{}`   |

### usage

simply call

```
standupg
```

in your terminal; this will output your standup message and also write a markdown file in `~/.standupg/YYYY-MM-DD.md`
