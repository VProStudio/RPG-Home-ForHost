import ModalFactory from "./modal_factory.js";
import AchievementsModule from "./achives_factory.js";
import Toastify from 'toastify-js';
import Background from "./background.js";
import SVG_Models from "./svg_models.js";
import ProgressBar from 'progressbar.js';

export class View {
    constructor() {
        this.basePic = {
            1: '/assets/avatar1.jpg',
            2: '/assets/avatar2.jpg',
            3: '/assets/avatar3.jpg',
            4: '/assets/avatar4.jpg',
            5: '/assets/test-pic.jpg'
        };
        this.modalFactory = new ModalFactory();
        this.clouds = new Background();
        this.svg = new SVG_Models();
        setTimeout(() => this.achievements = new AchievementsModule(), 300);
        this.initModals();
        this.cosmeticInit();
        this.currentBackground = null;
    }


    initModals() {
        this.modalFactory.create('tasks', 'modal-tasks', 'control', `
            <div class="tasks-content">
                <h2 class="modal-title text">Задания</h2>
                <button class= "to-newTask btn"
                        data-action="modal" 
                        data-modal-id="newTask" 
                        data-context="main">Новая задача</button>
                <select class="filter-select" data-action="filter"
                        data-input="filter-list">
                    <option value="incomplete">Невыполненные</option>
                    <option value="completed">Выполненные</option>
                    <option value="all" selected>Все</option>
                </select>
                <select class="sort-select" data-action="sort"
                        data-input="sort-list">
                        <option value="alphabet">По алфавиту</option>
                        <option value="date" selected>По дате</option>
                </select>
                <div class="tasks-list"></div>
            </div>
        `);

        this.modalFactory.create('auth', 'modal-auth', 'none', `
            <div class="auth-content">
                <button 
                    class="auth-button auth-join btn" 
                    data-action="auth" 
                    data-auth="join">Войти</button>
                <button 
                    class="auth-button auth-reg btn" 
                    data-action="auth" 
                    data-auth="reg">Зарегистрироваться</button>
                <button 
                    class="auth-button auth-google btn" 
                    data-action="google-auth">
                                        <span class="google-wrapper">
                        <span class="google-text">G</span>
                    </span></button>
                <div class="auth-container hidden">
                    <button data-action="back-to-auth-choose"><<</button>
                    <input type="email" data-input="name" placeholder="Имя">
                    <input type="password" data-input="password" placeholder="Пароль">
                    <button 
                        class="auth-confirm-button"
                        data-action="confrim-auth"
                        data-auth=""></button>
                </div>
            </div>
        `);

        this.modalFactory.create('ladder', 'modal-ladder', 'control', `
            <div class="ladder-content">
            <h2 class="modal-title">Рейтинг</h2>
                <div class="ladder-list"></div>
            </div>
        `);

        this.modalFactory.create('newTask', 'modal-newTask', 'control', `
            <div class="newTask-content">
                <h2 class="modal-title">Новая задача</h2>
                <input type="text" data-input="title" placeholder="Название"
                    class="newTask-name-content name-input">
                <select class="newTask-content-select select"
                    data-input="category">
                    <option disabled selected>Категория</option>
                   
                </select>
                    <div class="description-container">
                        <button class="open-description btn" 
                            data-action="toggle-description">Добавить описание</button>
                        <textarea data-input="description" placeholder="Описание" 
                            class="newTask-textarea-content description-input" 
                            style="display: none;"></textarea>
                    </div>
                <button class="create-new-task btn" data-action="create-task">Создать</button>
            </div>
        `);

        this.modalFactory.create('profileNav', 'modal-profileNav', 'control', `
            <div class="profileNav-content">
                <button class= "to-profileData button"
                        data-action="modal" 
                        data-modal-id="profileData">Мои данные</button>
                <button class= "to-achives button"
                        data-action="modal" 
                        data-modal-id="achievements">Достижения</button>
            </div>
        `);

        this.modalFactory.create('achievements', 'modal-achievements', 'control', `
            <div class="achievements-content">
                <h2 class="modal-title">Достижения</h2>
                <div class="achives-list"></div>
            </div>
        `);

        this.modalFactory.create('profileData', 'modal-profileData', 'control', `
            <div class="profileData-content">
            <h2 class="modal-title profile-title">Мои данные</h2>
                <div class="profile-data">
                    <div class="my-profile-name profile-field">
                        <div class="text name-text"></div>
                        <input class="input name-text hidden" 
                            data-field="name" 
                            placeholder="Введите имя">
                    </div>

                    <div class="my-profile-birthdate profile-field">
                        <div class="text birth-text"></div>
                        <input class="input birth-text hidden" 
                            type="date"
                            data-field="birthDate" 
                            placeholder="Выберите дату">
                    </div>
                    </div>
                <button class="edit-profile-data btn"
                        data-action="edit-profile">Редактировать</button>
                <button class="to-avatarChose btn"
                        data-action="modal"
                        data-modal-id="avatarChose">Сменить аватар</button>
                <div class="profile-points">Очки: {{points}}</div>
                <div class="profile-level"> 1 lvl</div>
                <div class="profile-level-bar"></div>
                <button class="log-out-btn btn"
                        data-action="log-out">выйти</button>
            </div>
        `);

        this.modalFactory.create('avatarChose', 'modal-avatarChose', 'control', `
            <h2 class="modal-title">Выбор аватара</h2>
            <div class="avatarChose-content">
                ${this.getProfilePhotos()}
                <button class="profile-button reset-avatar" data-action="reset-avatar">C</button>
            </div>
        `);


    }

    getVoiceButton() {
        return document.querySelector('.voice')
    }

    changeVoiceButtonState() {

    }

    getTaskToggleSound() {
        return document.querySelector('.task-toggle-sound')
    }

    getAmbientElement() {
        return document.querySelector('.ambient')
    }
    switchBackgroundTheme(isLightTheme) {
        if (isLightTheme) {
            this.clouds.init();
        } else {
            this.clouds.clearAll();
        }
    }



    cosmeticInit() {
        this.bindButtonsAndPics();
        // this.moderateProfileNavMenuPos();
        this.getSettingsForm();
    }

    getSettingsForm() {
        const form = document.querySelector('.settings');
        form.addEventListener('submit', (event) => {
            event.preventDefault();
        });
    }

    handleAchievementUpdate(name, progress) {
        this.achievements.updateProgress(name, progress);
    }

    updatePointsDisplay(points) {
        const pointsElement = document.querySelector('.profile-points');
        if (pointsElement) {
            pointsElement.textContent = `Очки: ${points || 0}`;
        }
    }

    renderTasks(tasks) {
        const tasksList = document.querySelector('.tasks-list');
        if (tasksList) {
            tasksList.innerHTML = tasks.map(task => this.createTaskHTML(task)).join('');
        }
    }

    createTaskHTML(task) {
        return `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <input type="checkbox" data-action="toggle-task" ${task.completed ? 'checked' : ''}>
                <div class="task-content">
                    <h3 class="task-title">${task.title}</h3>
                    ${task.description ? `<p class="task-desc">${task.description}</p>` : ''}
                    <p>${task.category.name}</p>
                </div>
                <div class="task-controls">
                    <button data-action="edit-task">✏️</button>
                    <button data-action="delete-task">🗑️</button>
                </div>
            </div>
        `;
    }

    switchDecsription() {
        const desc = document.querySelector('.description-input');
        desc.style.display = desc.style.display === 'none' ? 'block' : 'none';
    }


    getProfilePhotos() {
        return Object.values(this.basePic).map(src => `<img class="image avatars" 
                                                            data-action="change-avatar" 
                                                            src="${src}">`).join('');
    }

    createOption(select, categories) {
        select.innerHTML = `
        <option disabled selected>Категория</option>
        ${categories.map(cat => `
            <option 
                value="${cat.id}" 
                data-difficulty="${cat.difficulty}"
            >
                ${cat.name}
            </option>
        `).join('')}
    `;
    }

    getCategorySelect() {
        return document.querySelector('[data-input="category"]');
    }

    changeAvatar(pictueLink) {
        const avatarPlace = document.querySelector('.profile-image');
        avatarPlace.src = pictueLink;
    }

    disableTask(task) {
        task.disabled = true;
    }

    enableTask(task) {
        task.disabled = false;
    }

    getInputChoseContainer() {
        return document.querySelector('.auth-content');
    }

    handleAuth(authType, btnText) {
        const outerContainer = this.getInputChoseContainer();
        const button = outerContainer.querySelector(`.auth-confirm-button`);
        this.changeAuthVisability(outerContainer);
        this.editAuthButton(button, authType, btnText);
    }

    editAuthButton(button, authType, btnText) {
        console.log(button, authType, btnText);
        button.textContent = `${btnText}`;
        button.dataset.auth = `${authType}`;
    }

    changeAuthVisability(outerContainer) {
        const buttons = outerContainer.querySelectorAll('.auth-join, .auth-reg, .auth-google');
        const container = outerContainer.querySelector('.auth-container');
        buttons.forEach(button => {
            button.style.display = button.style.display === 'none' ? 'block' : 'none';
        });
        if (container.classList.contains('hidden')) {
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
    }

    showAuthModal() {
        const modal = document.querySelector('.modal-auth');
        modal.classList.add('active');
    }

    showBackgroundBlock() {
        const backgroundBlock = document.querySelector('.background-block');
        backgroundBlock.classList.remove('hidden');
        backgroundBlock.classList.add('active');
    }

    renderAuthorisation() {
        const modalAuth = document.querySelector('.modal-auth');
        const backgroundBlock = document.querySelector('.background-block');

        modalAuth.classList.remove('active');
        this.hideBackgroundBlock();
        this.showAlertToast('Вы успешно авторизованы!')
    }

    hideBackgroundBlock() {
        const backgroundBlock = document.querySelector('.background-block');
        backgroundBlock.classList.remove('active');
        backgroundBlock.classList.add('hidden');
    }

    getAvatarContainer() {
        return document.querySelector('.profile-image');
    }

    renderAvatar(avatarUrl) {
        const avatarContainer = this.getAvatarContainer();
        avatarContainer.src = avatarUrl;
    }

    showAlertToast(text) {
        Toastify({
            text: text,
            duration: 3000,
            gravity: "bottom", // Показывать снизу
            position: "center", // Центр экрана
            backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)",
            className: "custom-toast", // Добавляем кастомный класс
            style: {
                "margin-bottom": "20px", // Отступ от края
                "box-shadow": "0 4px 12px rgba(0,0,0,0.15)"
            },
            offset: {
                y: 20 // Вертикальный отступ
            }
        }).showToast();
    }

    showErrorToast(text) {
        Toastify({
            text: text,
            duration: 3000,
            gravity: "bottom", // Показывать снизу
            position: "right", // Справа
            backgroundColor: "linear-gradient(to right, rgb(195, 101, 43), rgb(223, 75, 75))",
            className: "custom-toast",
            style: {
                "margin-bottom": "20px",
                "box-shadow": "0 4px 12px rgba(0,0,0,0.15)"
            },
            offset: {
                y: 20
            }
        }).showToast();
    }

    removeAllActiveElements() {
        document.querySelectorAll('.active').forEach(element => {
            element.classList.remove('active');
        });
    }

    showTasksError(message) {
        const tasksList = document.querySelector('.tasks-list');
        if (tasksList) {
            tasksList.innerHTML = `<div class="error">${message}</div>`;
        }
    }

    showLoadingIndicator() {
        const tasksList = document.querySelector('.tasks-list');
        if (tasksList) {
            tasksList.innerHTML = `<div class="loading">Загрузка задач...</div>`;
        }
    }

    showLoadingState() {
        const tasksList = document.querySelector('.tasks-list');
        if (tasksList) tasksList.innerHTML = '';


        const avatar = document.querySelector('.profile-image');
        if (avatar) avatar.src = '/assets/test-pic.jpg';
        console.log('loading')
    }

    showUnlockEffect(achievementName) {
        Toastify({
            text: `🎉 Достижение "${achievementName}" разблокировано!`,
            duration: 3000,
            backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)"
        }).showToast();
    }

    updateProgressBars(progressData) {
        progressData.forEach(({ name, current, target }) => {
            const progress = (current / target) * 100;
            this.achievements.updateProgress(name, progress);
        });
    }

    renderLadder(users) {
        const container = document.querySelector('.ladder-list');
        container.innerHTML = `
            <div class="ladder-header">
                <span class="ladder-place">Место</span>
                <span class="ladder-name">Игрок</span>
                <span class="ladder-points">Очки</span>
            </div>
            ${users.map((user, index) => `
                <div class="ladder-row ${index === 0 ? 'gold' : ''}">
                    <div class="place ladder-item">${index + 1}</div>
                    <div class="name ladder-item">${user.name}</div>
                    <div class="points ladder-item">${user.points}</div>
                </div>
            `).join('')}
        `;
    }

    bindButtonsAndPics() {
        this.bindSoundButtonPic();
        this.bindThemeButtonPic();
        this.bindProfileButtonPic();
        this.bindAchivementsButtonPic();
    }

    getSoundButton() {
        return document.querySelector('.voice');
    }

    getThemeButton() {
        return document.querySelector('.theme');
    }

    getProfileButton() {
        return document.querySelector('.to-profileData');
    }

    getAchivementsButton() {
        return document.querySelector('.to-achives');

    }

    bindSoundButtonPic() {
        const button = this.getSoundButton();

        const pic = this.svg.drawSound();

        button.innerHTML = pic;

    }

    bindThemeButtonPic() {
        const button = this.getThemeButton();

        const pic = this.svg.drawMoon();

        button.innerHTML = pic;

    }

    bindProfileButtonPic() {
        const button = this.getProfileButton();

        const pic = this.svg.drawProfile();

        button.innerHTML = pic;

    }

    bindAchivementsButtonPic() {
        const button = this.getAchivementsButton();

        const pic = this.svg.drawTrophy();

        button.innerHTML = pic;

    }

    initLvlProgress(data) {
        const barContainer = document.querySelector('.profile-level-bar');

        if (!barContainer) {
            console.error('Элемент .profile-level-bar не найден');
            return;
        }

        if (!this.progressBar) {
            this.progressBar = new ProgressBar.Line(barContainer, {
                strokeWidth: 3,
                easing: 'easeInOut',
                color: '#2CCCDA',
                trailColor: '#eee',
                trailWidth: 3,
                svgStyle: { width: '100%', height: '15px' }
            });
        }

        if (data) this.updateLvlProgress(data);
    }

    updateLvlProgress(data) {
        if (!this.progressBar) {
            this.initLvlProgress(data);
            return;
        }

        const validData = data &&
            typeof data.level !== 'undefined' &&
            typeof data.progress !== 'undefined';

        if (!validData) {
            console.error('Некорректные данные:', data);
            return;
        }

        this.progressBar.animate(data.progress / 100);
        const level = document.querySelector('.profile-level');
        level.textContent = `Уровень ${data.level}`;
    }

    hideLoaderAfterLoad() {
        const loaderContainer = document.querySelector('.loader-container');
        window.addEventListener('load', function () {
            this.setTimeout(() => loaderContainer.classList.add('hidden'), 1000);

        });
    }

}