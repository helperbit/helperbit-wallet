# Style Guide

## Eslint Rules

Check the .eslintrc file for the complete rule list.


## Commenti
Usare sempre i commenti /* */, a meno che non sia un commento in una riga dove c'e' gia' codice, esempio:

```javascript
let ciao = 'mondo' + 'marcio'; // + 'gianni'
```

I commenti sempre in lowercase con iniziali maiuscole. Se un commento tra /* */ serve per separare delle sezioni, usare:

```javascript
/*** Sezione */
let codice = ...;
```


## A capo
Cercare di non mettere troppi a capo dove non servono; in particolare:

- usare un a capo per separare due funzioni
- usare 2 a capo per separare due sezioni (per esempio fields e methods)
- non usare a capo dopo che si apre una funzione



## ES2015

### Var, Let e Const
Seppur il codice transpilato utilizza comunque i var, abituarsi ad usare let e const.

- const lo usiamo quando abbiamo un dato che non deve cambiare
- let lo usiamo per tutto il resto

