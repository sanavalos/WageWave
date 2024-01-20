const vscode = require('vscode');

let hourlyRate;
let totalEarned = 0;
let statusBarItem;
let timerInterval;
let isWageWavePaused = false;

function activate(context) {

  const startWageWave = async () => {
    if (isWageWavePaused) {
      vscode.window.showInformationMessage('WageWave is already paused. Resume it using "Resume WageWave" command.');
      return;
    }
    if (hourlyRate) {
      vscode.window.showInformationMessage('WageWave is already running. Use "Pause WageWave" command to pause it.');
      return;
    }

    const rateInputOptions = {
      prompt: 'Enter your hourly rate (USD)',
      placeHolder: 'e.g., 25',
      validateInput: (value) => {
        const parsedValue = parseFloat(value);
        if (isNaN(parsedValue) || parsedValue <= 0) {
          return 'Please enter a valid positive number for the hourly rate.';
        }
        return null;
      },
    };

    hourlyRate = await vscode.window.showInputBox(rateInputOptions);

    const intervalInputOptions = {
      prompt: 'Enter update interval in minutes',
      placeHolder: 'e.g., 5',
      validateInput: (value) => {
        const parsedValue = parseInt(value);
        if (isNaN(parsedValue) || parsedValue <= 0) {
          return 'Please enter a valid positive integer for the update interval.';
        }
        return null;
      },
    };

    const interval = await vscode.window.showInputBox(intervalInputOptions);
    timerInterval = parseInt(interval) * 60 * 1000; 
    if(!hourlyRate || !timerInterval){
     vscode.window.showInformationMessage(`Oops! Something went wrong setting hourly rate/intervals.`);
     return
    }
    vscode.window.showInformationMessage(`Hourly rate set to $${hourlyRate}. WageWave started with ${interval}-minute intervals.`);
    updateEarnedMoney(); 

    const intervalId = setInterval(updateEarnedMoney, timerInterval);

    context.subscriptions.push({
      dispose: () => clearInterval(intervalId),
    });
  };

  const updateEarnedMoney = () => {
    if (!hourlyRate || isWageWavePaused) {
      return;
    }
    if (statusBarItem){
     const earnedMoney = ((hourlyRate / 60 / 60 / 1000) * timerInterval).toFixed(2);

     totalEarned += parseFloat(earnedMoney);
 
     const notification = vscode.window.showInformationMessage(`Earned money: $${earnedMoney}`);
 
     setTimeout(() => {
       notification.dispose();
     }, 5000);
 
    }
    updateStatusBar();
  };

  const updateStatusBar = () => {
    if (!statusBarItem) {
      statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
      context.subscriptions.push(statusBarItem);
    }

    statusBarItem.text = `💰 Total Earned: $${totalEarned.toFixed(2)}`;
    statusBarItem.show();
  };

  const pauseWageWave = () => {
    if (!isWageWavePaused) {
      isWageWavePaused = true;
      vscode.window.showInformationMessage('WageWave paused. Resume it using "Resume WageWave" command.');
    }
  };

  const resumeWageWave = () => {
    if (isWageWavePaused) {
      isWageWavePaused = false;
      vscode.window.showInformationMessage('WageWave resumed.');
    }
  };

  let disposable = vscode.commands.registerCommand('wagewave.startWageWave', startWageWave);
  let pauseDisposable = vscode.commands.registerCommand('wagewave.pauseWageWave', pauseWageWave);
  let resumeDisposable = vscode.commands.registerCommand('wagewave.resumeWageWave', resumeWageWave);

  context.subscriptions.push(disposable, pauseDisposable, resumeDisposable);
}

function deactivate() {
  if (statusBarItem) {
    statusBarItem.dispose();
  }
}

module.exports = {
  activate,
  deactivate,
};
