Lesmeg for *Plurality: The Future of Collaborative Technology and Democracy* av Audrey Tang, E. Glen Weyl og Plurality-fellesskapet

Velkommen til *Plurality*, et åpent, git-basert samarbeidsprosjekt om en bok som ønsker å tegne et bilde av fremtidens teknologi – en fremtid der vi dyrker sosiale forskjeller og bygger bro mellom dem, i stedet for å la dem splitte oss. Selve innholdet i boken er beskrevet andre steder (se https://www.plurality.net). Denne lesmeg-filen gir i stedet en oversikt over samarbeidet rundt boken, til hjelp for alle som ønsker å bidra.

# Slik bidrar du til den norske oversettelsen

Boken oversettes i to trinn, og hvert kapittel har samme filnavn i alle tre mappene:

    contents/english/             originalen fra rot-repoet, endres ikke her
      ↓  trinn 1: forenkling
    contents/simplified-english/  kortere og enklere engelsk, samme innhold
      ↓  trinn 2: oversettelse
    contents/norwegian/           norsk bokmål

Én jobb er ett kapittel i ett trinn, på én gren, i én pull request — for eksempel grenen
`translate/3-2`, som bare endrer `contents/norwegian/3-2-connected-society.md`. Alle
kapitler kan arbeides med samtidig; ingen kapitler venter på hverandre.

Se hva som kan startes akkurat nå:

```bash
vp run translation:next
```

Sjekk arbeidet ditt før du åpner en pull request:

```bash
vp run translation:validate
```

Faste termer ligger i `translation/glossary.tsv`, og norske kapitteltitler i
`translation/chapter-titles.tsv`. Begge er felles beslutninger — foreslå nye termer i
`translation/proposals/<kapittel>.tsv` i stedet for å endre ordlisten fra en kapittelgren.

Fullstendige instrukser, for både mennesker og AI-assistenter, ligger i
[AGENTS.md](AGENTS.md). Detaljer per trinn ligger i [docs/translation/](docs/translation/).
Bidragsytere som bruker en ren chat-assistent uten tilgang til repoet finner ferdige
ledetekster i [docs/translation/prompts/](docs/translation/prompts/).

# Oversikt

Prosjektet ledes i første omgang av Audrey Tang (Taiwans første digitaliseringsminister, se https://digitalminister.one) og E. Glen Weyl (se https://www.glenweyl.com). Planen er likevel å desentralisere styringen av prosjektet gradvis, ved hjelp av en ny styringsprotokoll bygget direkte på git – Gov4Git (se https://github.com/gov4git/gov4git) – som bygger på blokkjedelignende mekanismer. Målet er full fellesskapsstyring når boken trykkes i fysisk form. Alt materiale her er lisensiert under CC0, og vi håper at folk som snakker andre språk enn engelsk, eller som hører til andre språklige undergrupper (for eksempel trossamfunn eller fagmiljøer vi selv kjenner dårligere), vil forgrene (forke) dette repoet og lage sine egne versjoner, styrt etter de samme prinsippene. Den norske oversettelsen, som ligger i `contents/norwegian/`, er nettopp et slikt bidrag. Under går vi nærmere gjennom hvert av disse punktene, med lenker til relevant materiale.

# Opphavsrett

Alt materiale i dette repoet, og i resten av prosjektet for øvrig (med mindre annet er uttrykkelig oppgitt), er i det fri (public domain). En CC0-lisens ligger i repoet, og det meste av tilhørende programvare er GPL-lisensiert. Vi oppfordrer sterkt til oversettelser – både til andre språk og til andre kulturelle sjangre, enten det gjelder form (skjønnlitteratur, journalistikk osv.) eller målgruppe (religiøse, etniske eller faglige fellesskap osv.). Slike forgreninger står fritt til å gjøre hva de vil med dette fritt tilgjengelige materialet, men vi kommer bare til å lenke til og «anerkjenne» et mindre utvalg prosjekter som holder seg tett på innholdet, verdiene, styringsformen og opphavsretten i rot-prosjektet. Vi håper at tilknytningen til roten vil forbli relevant og respektert, fordi fellesskapet opparbeider seg legitimitet gjennom prinsippene sine og gjennom det som blir skrevet.

# Sitering

Bruk gjerne denne bibtex-oppføringen når du siterer teksten:

```bibtex
@online{plurality2023,
  title={Plurality: The Future of Collaborative Technology and Democracy},
  author={Weyl, E. Glen and Tang, Audrey and {the Plurality Community}},
  year={2023},
  url={https://github.com/pluralitybook/plurality/blob/main/contents/english},
  publisher={GitHub},
}
```

# Identitet og anerkjennelse

Prosjektet starter som et tradisjonelt åpen kildekode-fellesskap, men på sikt er målet å tilby mer formell styring, medbestemmelse, kontrollrettigheter og anerkjennelse av bidrag enn det som er vanlig i slike prosjekter. Vi mener slike mekanismer er viktige for at prosjekter som dette skal kunne vokse bærekraftig uten å miste verdiene sine på veien. Et hovedmål i forvaltningen av prosjektet blir derfor å anerkjenne bidrag tydelig og – som hovedregel – offentlig, både kvalitativt (hva slags bidrag som er gitt) og kvantitativt (hvor stort bidraget var), gjennom såkalte tokens. Disse tokenene kan imidlertid ikke handles eller overføres direkte mellom brukere; de har bare betydning for styringen av og deltakelsen i dette fellesskapet, og er ikke ment å ha noen økonomisk verdi utenfor fellesskapet. Som vi kommer tilbake til under, og i selve boken, kan det bli aktuelt å samle inn noe midler til fellesskapet, og disse midlene vil i så fall forvaltes av fellesskapet selv. Anerkjennelse er altså et mål på bidrag og en rett til medbestemmelse – ikke en vei til økonomisk gevinst.

Bidrag kan ta mange former. Vi kan umulig forutse alle sammen, men her er noen eksempler som gir et bilde av bredden vi ser for oss:
* Oversettelse av boken til andre språk og undergrupper.
* Hjelp med research og redigering av rot-teksten.
* Gjennomtenkt og presis prioritering av saker (issues) og endringsforslag (pull requests).
* Bidrag til, eller vedlikehold av, nettgrensesnittet for boken.
* Grafisk design av elementer i boken, inkludert visuelle bidrag og figurer.
* Vedlikehold av dataverktøy og datavisualiseringer.
* Prosjektledelse for å få disse elementene til å spille sammen.
* Bidrag til verktøyene og plattformene som støtter selve samarbeidsprosessen.

I starten vil kvaliteten på bidragene – og dermed omfanget av anerkjennelsen – i stor grad bli vurdert skjønnsmessig av prosjektlederne (med noen unntak som er omtalt lenger ned). På sikt håper vi likevel å overføre stadig flere av mekanismene for anerkjennelse til formell fellesskapsstyring, som en del av den gradvise desentraliseringen vi beskriver under.

Alle identitetsroller og all anerkjennelse vil i utgangspunktet være offentlige (eventuelt under pseudonym, men uten interne personverninnstillinger). På sikt håper vi å ta i bruk nyskapende personvernløsninger i tråd med ideene i boken, for eksempel såkalte designated verifier-signaturer – signaturer som bare kan bekreftes av én bestemt mottaker.

# Redigering og endringsforslag

Selv om bidrag kan ta mange former, er redigering av rot-boken nok den mest sentrale og vanligste. Det skjer gjennom den vanlige git-prosessen med forgrening (fork), endringsforslag (pull request) og sammenslåing (merge), som er godt dokumentert andre steder på nettet, og som vi derfor ikke går gjennom i detalj her. Flere av de viktigste kildene til anerkjennelse og bidrag henger sammen med nettopp denne prosessen, og fortjener derfor litt mer oppmerksomhet.

Målet med boken er å skape en ny visjon for teknologiens fremtid – en visjon som kan inspirere et fellesskap til å forfølge og virkeliggjøre den. Vi tar ikke først og fremst sikte på å slå fast objektive fakta eller å oppnå konsensus, selv om vi håper å bidra til å synliggjøre fakta og fremme samarbeid på tvers av uenighet. Derfor vil vi holde på en sammenhengende argumentasjon og en enhetlig forfatterstemme, fremfor å sy sammen separate bidrag fra ulike forfattere. Vi mener likevel at et slikt mål er fullt forenlig med bred deltakelse og mange innspill, og at ideene våre til syvende og sist bare vil lykkes dersom de etter hvert blir den alminnelige oppfatningen i et fellesskap som slutter opp om dem. Derfor håper vi at fellesskapet som hjelper oss med å bygge denne boken, vil bidra med alt fra små endringer, som korrekturlesing, til store bidrag, som tekstbolker som utdyper et eksempel eller omformulerer et prinsipp. Jo viktigere bidraget er, desto større blir anerkjennelsen. Vi ønsker også å ta i bruk teknologiske fremskritt i alt vi gjør, og ser derfor gjerne at generative språkmodeller og andre digitale hjelpemidler brukes i arbeidet med bidrag.

Samtidig regner vi med at engasjementet blir langt større enn det en liten gruppe prosjektledere realistisk kan håndtere alene – særlig siden et prosjekt som dette har sine naturlige motstandere. Derfor er det minst like viktig å dele redaktør- og vedlikeholdsrollen med fellesskapet som selve bidragsrollen. Vi planlegger å be fellesskapet om hjelp til å prioritere saker og endringsforslag, og å belønne treffsikker prioritering – altså prioriteringer som faktisk fører til at noe blir tatt inn eller fulgt opp. De konkrete mekanismene vil utvikle seg over tid, og vi kommer snart til å lenke til forklaringer som oppdateres løpende. Uansett vil vi alltid lete etter kreative løsninger forankret i prinsippene fra boken – for eksempel ved å kombinere prediksjonsmarkeder med ulike former for plural stemmegivning (stemmemåter som fanger opp mer enn et rent flertallsvalg).

# Styring og gradvis desentralisering

Alle styringsfunksjoner vil bygge på både de kvalitative og de kvantitative tokenene som er nevnt over. Styringen vil ta i bruk en rekke tilnærminger, fra formelle avstemninger til uformelle samtaler. Vi ønsker å bruke så mange som mulig av verktøyene vi beskriver i boken, slik at boken både viser og forteller sitt eget budskap. Styringen skal dekke hele bredden av spørsmål i prosjektet: utviklingen av alle repoer, beslutninger om den fysiske utgivelsen og så videre. I starten vil innspillene fra fellesskapet være rådgivende, og for endelige beslutninger vil det forbli slik helt frem til boken trykkes i fysisk form.

Målet er likevel å ta i bruk Gov4Git for å overføre full og direkte kontroll til fellesskapet etter at første utgave av den fysiske boken er trykket. Selv om det er der den formelle overgangen skjer, håper vi at veien dit blir gradvis: at vi over tid lar fellesskapet styre stadig flere beslutninger, og at vår egen rolle mer og mer blir en formalitet. Vi planlegger å innføre flere styringselementer underveis for å støtte denne overgangen, for eksempel signaler fra fellesskapet om verdien av ulike bidrag, som vi deretter kan godkjenne. For et inntrykk av hvilke styringsstrukturer vi ønsker å bruke, kan du besøke nettsidene til RadicalxChange (http://www.radicalxchange.org). Vi lenker til mer informasjon her etter hvert som planene for hvordan disse elementene skal brukes, blir klarere.

# Økonomiske mål

Vi har ingen ambisjoner om økonomisk avkastning fra noen del av prosjektet – tvert imot bruker vi en del av våre egne midler på å gjøre det mulig. Enkelte deler av prosjektet kan likevel trenge økonomisk støtte (for eksempel markedsføring og distribusjon av den fysiske boken), og mange av de frivillige i fellesskapet vil kanskje mene det er rimelig å få betalt for noe av tiden de legger ned. Vi har forpliktet oss til å legge alt grunnleggende materiale i det fri, og det er et kjerneprinsipp for prosjektet å unngå finansialisering og spekulasjon. Samtidig tror vi det finnes måter å hente inn midler på, der det trengs, som ikke bare er forenlige med verdiene våre, men som også illustrerer dem. Vi ønsker innspill fra fellesskapet om dette. Her er noen foreløpige tanker fra oss:
1. NFT-er (non-fungible tokens) som følger med fysiske bokeksemplarer, og som gjør at boken kan selges med prispåslag selv om innholdet ikke er opphavsrettsbeskyttet.
2. Innsamling av midler gjennom kvadratisk finansiering (quadratic funding) på plattformer som GitCoin.
3. Bruk av delt eierskap og Harberger-tokens (en eierskapsmodell der eieren selv setter prisen, men også må betale skatt av den og godta ethvert bud) for å fordele tilgangen til knappe ressurser knyttet til prosjektet (som Glens tid til konsulentarbeid og foredrag).
4. Utstedelse av kompetansebevis og SoulBound-tokens (ikke-overførbare tokens knyttet til én bruker), både til dem som bidrar økonomisk direkte, og til dem som finansierer prosjektet gjennom GitCoin.

Vi planlegger å følge opp disse tilnærmingene og å legge eventuelle innsamlede midler under fellesskapets kollektive kontroll, etter at nødvendige utgifter til trykking og distribusjon av den fysiske boken er dekket. Vi er klar over at dette krever juridiske grep for å sikre at vi følger organisasjonsformene og regelverket i de aktuelle jurisdiksjonene, og vi planlegger å ta disse skrittene i løpet av de nærmeste månedene, eventuelt med hjelp fra Open Collective Foundation.

# Offisielle oversettelsesrepoer

Vi oppfordrer ulike fellesskap til å hjelpe oss med å oversette innholdet til flere språk, slik at boken blir tilgjengelig for flere rundt om i verden. Alle står fritt til å forgrene repoet og sette i gang sitt eget oversettelsesarbeid. Målet vårt er å la fellesskap bidra på en skalerbar og desentralisert måte, samtidig som oversettelsene kan få offisiell status etter godkjenning.

Her er en [enkel oppstartsguide](https://docs.plurality.net/contributing/Contributing%20translations/). Bli gjerne med i [Discord](https://discord.gg/YWSDRqdW5n) for å avtale med teamet om å få forgreningen din godkjent og listet opp her, få oversettelsesarbeidet ditt vist på nettsiden og gi tilbakemelding på hvordan vi kan forbedre prosessen.

_Merk: Tradisjonell kinesisk og engelsk regnes begge som rotspråk og ligger i dette repoet, mens forgreningene (forkene) forvaltes av enkeltmedlemmer i fellesskapet._

Aktive oversettelsesmiljøer og -repoer:

- Ukrainsk: https://github.com/vlree-alt/plurality-ukrainian
- Japansk: https://github.com/nishio/plurality-japanese
- Tysk: https://github.com/GermanPluralityBook/pluralitaet
- Koreansk: https://github.com/park-haewon/plurality-korean
- Fransk: https://github.com/xitobal/radicalxchangeparis.github.io/tree/main/public/Plurality%2C%20le%20livre%20-%20G%20Weil
- Norsk: https://github.com/NorwegianPlurality/Pluralitet-Bok

# Oppsummering og veien videre

Vi ser frem til å samarbeide med dere alle om dette spennende prosjektet. Ta gjerne kontakt på glen@plurality.net hvis du har spørsmål du ikke får svar på gjennom de vanlige samarbeidskanalene våre.
