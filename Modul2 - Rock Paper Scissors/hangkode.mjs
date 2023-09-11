if (feil.length === HANGMAN_UI.length) {
    console.log(dictionary.GAME_OVER);
  } else {
    const continueGame = await rl.question(dictionary.DO_YOU);
    if (continueGame.toLowerCase() === 'true') {
      for (let i = feil.length; i < 28; i++) {
        // Code to continue playing the game
      }
    } else {
      console.clear();
    }
  }