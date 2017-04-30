import moment from 'moment';
import _msg from './modules/msg';
import * as store from './modules/store';
import * as theme from './modules/theme';
import * as contributions from './modules/git-contribution';

const msg = _msg.init('popup');

/* compute CSS styles for progress bar */
const computeStyle = (count, totalCount) => {
  const text = `${count}/${totalCount} commits`;
  const percentage = Math.round((count / totalCount) * 100);
  const width = `${(percentage > 100) ? 100 : percentage}%`;
  const color = theme.getColor(percentage);
  return { color, text, width };
};

const updateContributions = ({ githubId, targetContributionCount }) => {
  contributions.getContributionsSummary(githubId)
    .then((commits) => {
      /* update daily progess bar */
      let computedStyle = computeStyle(commits.dayCount, targetContributionCount);
      document.getElementById('day-value').textContent = computedStyle.text;
      document.getElementById('day-progessBar').style.width = computedStyle.width;
      document.getElementById('day-progessBar').style.backgroundColor = computedStyle.color;

      /* request background page to update the badge */
      msg.bg('updateBadgeText', undefined, {
        text: commits.dayCount.toString(),
        color: computedStyle.color
      });

      /* update weekly progess bar */
      computedStyle = computeStyle(commits.weekCount, targetContributionCount * 7);
      document.getElementById('week-value').textContent = computedStyle.text;
      document.getElementById('week-progessBar').style.width = computedStyle.width;
      document.getElementById('week-progessBar').style.backgroundColor = computedStyle.color;

      /* update monthly progess bar */
      computedStyle = computeStyle(commits.monthCount,
        targetContributionCount * moment().daysInMonth());
      document.getElementById('month-name').textContent = `Month of ${moment().format('MMMM')}`;
      document.getElementById('month-value').textContent = computedStyle.text;
      document.getElementById('month-progessBar').style.width = computedStyle.width;
      document.getElementById('month-progessBar').style.backgroundColor = computedStyle.color;
    });
};

/* update avatar image, userId & link to github profile page */
const updateAvatar = (githubId) => {
  document.getElementById('user-link').href = `https://www.github.com/${githubId}`;
  document.getElementById('user-link').textContent = `${githubId}'s`;
  document.getElementById('user-avatar').src = `https://avatars0.githubusercontent.com/${githubId}`;
};

/* --------------------------------------
 VIEW FUNCTIONS
-------------------------------------- */
const SHOW_MAIN_VIEW = () => {
  document.getElementById('mainView').style.display = 'block';
  document.getElementById('formView').style.display = 'none';
};
const SHOW_FORM_VIEW = () => {
  document.getElementById('mainView').style.display = 'none';
  document.getElementById('formView').style.display = 'block';
};
const UPDATE_MAIN_VIEW = () => {
  const data = store.load();
  if (data) {
    const { targetContributionCount, githubId } = data;
    updateContributions({ githubId, targetContributionCount });
    updateAvatar(githubId);
  }
};

/* --------------------------------------
 START OF APPLICATION
-------------------------------------- */
if (store.load()) {
  UPDATE_MAIN_VIEW();
  SHOW_MAIN_VIEW();
} else {
  SHOW_FORM_VIEW();
}

document.getElementById('formView-submit').addEventListener('click', () => {
  const githubId = document.getElementById('formView-id').value;
  const targetContributionCount = parseInt(document.getElementById('formView-count').value, 10);
  store.save({ githubId, targetContributionCount });

  UPDATE_MAIN_VIEW();
  SHOW_MAIN_VIEW();

  /* request background to update their local data */
  msg.bg('updateData');
});

document.getElementById('formView-cancel').addEventListener('click', () => {
  SHOW_MAIN_VIEW();
});
