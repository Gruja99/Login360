# Login360


Instalirati npm install zatim npm run dev

1. Slanje email za token
localhost:3000/singup
Parametri: email i password
Odgovor: token u mejlu

2. Verifikacija email za token
localhost:3000/email-activate
Parametri: token iz mejla
Odgovor: Poruka o prijavi

3. Login
localhost:3000/login
Parametri: email i password
Odgovor: token

4. Promena sifre
localhost:3000/change-password
Parametri: token, password, newpassword
Odgovor: Poruka o izvrsenoj promeni

5. Zahtev za sms porukom
localhost:3000/sms-request
Parametri: token: kada se login , sms se setuje na true, phone: u formatu +3810342323
Odgovor: Promena u bazi ponovi login
Proba se ponovo login tada se salje sms za verifikaciju. Dobija se sms na telefon.

6. Verifikacija smsa tj login preko koda
localhost:3000/sms-verify
Parametar: code: koji smo dobili
Odgovor: token

