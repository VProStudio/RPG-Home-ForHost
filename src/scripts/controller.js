// import { Timestamp } from "firebase/firestore";

export class Controller {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.history = [];
        this.setupAuthListener();
        this.initEventListeners();
        this.sound = null;
        //flags
        this.isEditing = false;

    }

    PROFILE_STATES = {
        EMPTY: 'empty',
        VIEW: 'view',
        EDIT: 'edit'
    };

    setupAuthListener() {
        this.model.onAuthStateChanged = () => {
            this.handleUserVisibleData();
            this.view.renderAuthorisation();
        };
    }

    initEventListeners() {
        document.addEventListener('click', e => this.handleClick(e));
        document.addEventListener('input', e => this.handleInput(e));
        document.addEventListener('keyup', e => {
            if (e.key === 'Escape') this.closeCurrentModal();
        });

    }

    setupAchievementListeners() {
        this.model.onTaskUpdated(async (task) => {
            if (task.completed) {
                await this.checkCategoryAchievements(task.category.id);
                await this.checkFirstTaskAchievement();
            }
        });
    }


    async init() {
        try {
            await this.#initializeCore();
        } catch (error) {
            console.error('Ошибка инициализации:', error);
            this.view.showAuthModal();
        }
    }

    async #initializeCore() {
        this.#resetModelState();
        const user = await this.model.initializeAuth();

        if (!user) {
            this.view.showAuthModal();
            return;
        }

        this.#initializeAuthorizedUser();
    }

    #resetModelState() {
        this.model.tasks = [];
        this.model.profileData = {};
    }

    async #initializeAuthorizedUser() {
        this.view.renderAuthorisation();
        this.view.showLoadingIndicator();

        await this.#loadEssentialData();
        this.#setupCoreListeners();
        await this.#initializeProgressSystems();
        this.#configureUserPreferences();
    }

    async #loadEssentialData() {
        await Promise.all([
            this.model.loadProfileData(),
            this.model.fetchTasks()
        ]);
    }

    #setupCoreListeners() {
        this.model.setupTasksListener();
        this.setupAchievementListeners();
        this.setupPointsListener();
    }

    async #initializeProgressSystems() {
        const [progressData, initialData] = await Promise.all([
            this.model.loadAchievementsProgress(),
            this.#getProgressInitialData()
        ]);

        this.view.initLvlProgress(initialData);
        this.view.updateLvlProgress(initialData);
        this.view.updateProgressBars(progressData);
        this.model.updateLadder();
    }

    #getProgressInitialData() {
        return {
            level: this.model.getLevel(),
            progress: this.model.getProgress(),
            currentXP: this.model.profileData.points || 0,
            nextLevelXP: this.model.getNextLevelXP()
        };
    }

    #configureUserPreferences() {
        this.model.handleCategorySelector();
        this.loadTheme();
        this.loadSoundState();
        this.runAmbient();
    }

    handleClick(e) {
        const action = e.target.dataset.action;
        const modalId = e.target.dataset.modalId;
        const authType = e.target.dataset.auth;
        const taskId = e.target.closest('.task-item')?.dataset.taskId;

        if (modalId) this.handleModalAction(modalId);
        if (taskId) this.handleTaskAction(action, taskId);

        switch (action) {
            case 'toggle-description':
                this.controlDescription();
                break;
            case 'create-task':
                this.handleCreateTask();
                this.makeCloseBackgroundBlock();
                break;
            case 'close':
                this.closeModalByElement(e.target);
                break;
            case 'filter':
                this.handleFilterList(e.target.value);
                break;
            case 'sort':
                this.handleSortList(e.target.value);
                break;
            case 'change-avatar':
                this.handleChangeAvatar(e.target.src);
                break;
            case 'auth':
                this.handleAuth(authType, e.target.textContent);
                break;
            case 'google-auth':
                this.handleGoogleAuth();
                break;
            case 'back-to-auth-choose':
                this.handleHidingInputs();
                break;
            case 'log-out':
                this.handleLogout();
                break;
            case 'edit-profile':
                this.handleEditProfile();
                break;
            case 'reset-avatar':
                this.resetAvatarToDefault();
                break;
            case 'theme':
                this.switchTheme();
                break;
            case 'voice':
                this.toggleSound();
                break;
            case 'confrim-auth':
                if (authType === 'join') {
                    this.confrimLogin();
                } else {
                    this.confrimRegistration();
                }
                break;
            case 'edit-task':
                if (taskId) {
                    this.openEditForm(taskId);
                } else {
                    console.warn('No task ID found');
                }
                break;
            default:
                console.warn(`Unknown action: ${action}`);
        }
    }

    loadSoundState() {
        const soundEnabled = localStorage.getItem('soundEnabled') === 'true';
        this.soundToggle(soundEnabled);
        this.makeChangeVoiceButtonState(soundEnabled);
    }

    soundToggle(soundEnabled) {
        this.sound = this.view.getAmbientElement();
        if (soundEnabled) {
            this.sound.play();
            this.makeChangeVoiceButtonState(soundEnabled);
            localStorage.setItem('soundEnabled', 'true');

        } else {
            this.sound.pause();
            this.makeChangeVoiceButtonState(soundEnabled);
            localStorage.setItem('soundEnabled', 'false');
        }
    }

    makeChangeVoiceButtonState(soundEnabled) {
        const button = this.view.getVoiceButton();
        if (soundEnabled) {
            button.style.boxShadow = '0 0 20px rgba(255, 86, 34, 0.66)';
        } else {
            button.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.2)';
        }
    }

    runAmbient() {
        this.sound = this.view.getAmbientElement();
        this.sound.volume = 0.01;
        if (localStorage.getItem('soundEnabled') === 'true') {
            this.sound.play();
        }
    }

    toggleSound() {
        const soundEnabled = localStorage.getItem('soundEnabled') === 'true';
        this.soundToggle(!soundEnabled);
    }

    runTaskToggleSound() {
        this.toggleTask = this.view.getTaskToggleSound();
        if (localStorage.getItem('soundEnabled') === 'true') {
            this.toggleTask.loop = false;
            this.toggleTask.play();
        }
    }

    getTheme() {
        return html.getAttribute('data-theme') === 'dark';
    }

    switchTheme() {
        const html = document.documentElement;
        const isDark = html.getAttribute('data-theme') === 'dark';

        html.setAttribute('data-theme', isDark ? 'light' : 'dark');
        this.view.switchBackgroundTheme(isDark);

        localStorage.setItem('theme', isDark ? 'light' : 'dark');
    };

    loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        }
        this.view.switchBackgroundTheme(savedTheme);
    }

    async checkCategoryAchievements(categoryId) {
        try {
            const count = await this.model.getCompletedTaskCount(categoryId);
            console.log(`[DEBUG] Задач выполнено: ${count} для категории ${categoryId}`);

            if (count >= 10) {
                const achievementName = this.getAchievementNameByCategory(categoryId);
                await this.model.unlockAchievement(achievementName);
                console.log(`[SUCCESS] Достижение "${achievementName}" разблокировано!`);
            }
        } catch (error) {
            console.error('[ERROR] Ошибка проверки:', error);
        }
    }

    getAchievementNameByCategory(categoryId) {
        const achievementsMap = {
            1: 'Мыльный мастер',
            2: 'Полировщик',
            3: 'Пылесосный чемпион',
            4: 'Гладильный эксперт',
            5: 'Стиральный мастер',
            6: 'Организатор',
            7: 'Ремонтник',
            8: 'Косметический эксперт',
            9: 'Санитарный эксперт',
            10: 'Чистюля',
        };
        return achievementsMap[categoryId] || 'Неизвестное достижение';
    }

    async checkFirstTaskAchievement() {
        const total = await this.model.getTotalTasks();
        this.view.handleAchievementUpdate('Чистюля', total >= 1 ? 100 : 0);
    }

    async resetAvatarToDefault() {
        console.log(this.model.checkGoogleFlag());
        if (await this.model.checkGoogleFlag()) {
            const url = this.model.getGoogleAvatarCookie();
            this.model.handleRenderAvatar(url);
            this.model.saveAvatarUrl(url);
        } else {
            const url = '/assets/test-pic.jpg';
            this.model.handleRenderAvatar(url);
            this.model.saveAvatarUrl(url);
        }
        setTimeout(() => this.handleUserVisibleData(), 500);
    }

    handleLogout() {
        this.model.logout();
        this.handleUserVisibleData();
    }

    handleHidingInputs() {
        const outerContainer = this.view.getInputChoseContainer();
        this.view.changeAuthVisability(outerContainer);
    }

    handleAuthInput() {
        this.model.isPasswordValid();
    }

    getEmail() {
        const email = document.querySelector('input[type="email"]').value;
        if (!this.model.isEmailValid(email)) console.warn('Email is not valid')
        return email;
    }

    getPasswordWithValid() {
        const password = document.querySelector('input[type="password"]').value;
        if (!this.model.isPasswordValid(password)) {
            console.warn('Password is not valid')
            return;
        }
        return password;
    }

    getPassword() {
        return document.querySelector('input[type="password"]').value;
    }


    confrimLogin() {
        const email = this.getEmail();
        const password = this.getPasswordWithValid();
        this.model.handleLogin(email, password);
    }

    confrimRegistration() {
        const email = this.getEmail();
        const password = this.getPassword();
        this.model.handleRegistration(email, password);
    }

    async handleGoogleAuth() {
        this.model.joinWithGoogle();
    }

    handleAuth(authBtn, btnText) {
        this.view.handleAuth(authBtn, btnText);
    }

    handleChangeAvatar(pictueLink) {
        this.view.changeAvatar(pictueLink);
        this.model.saveAvatarUrl(pictueLink);
        this.closeModal('avatarChose');
    }

    handleFilterList(target) {
        this.model.filterTasks(target);
        this.refreshTaskList();
    }

    handleSortList(target) {
        this.model.sortTasks(target);
        this.refreshTaskList();
    }

    handleInput(e) {
        if (e.target.dataset.input === 'category') {
            const select = e.target;
            const selectedOption = select.options[select.selectedIndex];
            this.model.currentTaskData.category = {
                id: select.value,
                name: selectedOption.text
            };
        } else if (e.target.dataset.input) {
            const type = e.target.dataset.input;
            const value = e.target.value;
            this.model.currentTaskData[type] = value;
        }
    }

    handleModalAction(modalId) {
        this.history.push(modalId);
        this.view.modalFactory.show(modalId);
        if (modalId === 'profileData' || modalId === 'achievements') {
            this.closeModal('profileNav');
        }
        if (modalId === 'profileData') {
            setTimeout(() => {
                const initialData = {
                    level: this.model.getLevel(),
                    progress: this.model.getProgress(),
                    currentXP: this.model.profileData.points || 0,
                    nextLevelXP: this.model.getNextLevelXP()
                };
                this.view.initLvlProgress(initialData);
            }, 10)
            this.makeShowBackgroundBLock();
        }
        if (modalId === 'tasks') {
            this.refreshTaskList();
        }
        if (modalId === 'profileNav') {
            this.handleUserVisibleData();
        }
        if (modalId === 'newTask') {
            this.model.handleCategorySelector();
            this.makeShowBackgroundBLock();
        }
    }


    makeShowBackgroundBLock() {
        this.view.showBackgroundBlock();
    }

    makeCloseBackgroundBlock() {
        this.view.hideBackgroundBlock();
    }

    handleTaskAction(action, taskId) {
        switch (action) {
            case 'toggle-task':
                this.handleToggleTask(taskId);
                break;
            case 'delete-task':
                this.model.deleteTask(taskId);
                break;
            case 'edit-task':
                this.openEditForm(taskId);
                break;
            default:
                console.warn(`Unknown action: ${action}`);
        }
        this.refreshTaskList();
    }

    async handleToggleTask(taskId) {
        try {
            const task = this.model.getTask(taskId);
            if (!task) return;

            this.runTaskToggleSound();

            const newCompleted = !task.completed;
            const difficulty = this.model.getDifficulty(task);
            const pointsDelta = newCompleted ? difficulty : -difficulty;

            await this.#performTaskUpdate(taskId, newCompleted);
            await this.#handlePointsUpdate(pointsDelta);
            await this.#processAchievements(task, newCompleted);

            await this.#updateProgressData();

        } catch (error) {
            console.error('Task toggle failed:', error);
            this.view.showNotification('Не удалось обновить задачу');
        }
    }

    async #performTaskUpdate(taskId, completed) {
        await this.model.updateTask(taskId, { completed });
    }

    async #handlePointsUpdate(pointsDelta) {
        await this.model.updateUserPoints(pointsDelta);
    }

    async #processAchievements(task, isCompleted) {
        const achievementName = this.getAchievementNameByCategory(task.category.id);
        const increment = isCompleted ? 1 : -1;

        await Promise.all([
            this.model.updateAchievementProgress(
                achievementName,
                task.category.id,
                increment
            ),
            this.model.checkAndUnlockAchievement(
                achievementName,
                task.category.id
            ).then(unlocked => {
                if (unlocked) {
                    this.view.showUnlockEffect(achievementName);
                }
            })
        ]);
    }

    async #updateProgressData() {
        const progressData = await this.model.loadAchievementsProgress();
        this.view.updateProgressBars(progressData);
        this.view.showAlertToast('Задача выполнена');
        this.model.updateLadder();
    }

    handleCreateTask() {
        const { title, category, description } = this.model.currentTaskData;

        if (title) {
            if (this.model.currentTaskData.id) {
                this.model.updateTask(this.model.currentTaskData.id, {
                    title,
                    category,
                    description
                });
            } else {
                this.model.addTask({ title, category, description });
            }
            this.refreshTaskList();
            this.closeModal('newTask');
        }
    }

    handleEditTask() {
        const { id, title, category, description } = this.model.currentTaskData;
        if (title) {
            this.model.updateTask(id, {
                title,
                category,
                description
            });
            this.refreshTaskList();
            this.closeModal('editTask');
        }
    }

    refreshTaskList() {
        this.view.renderTasks(this.model.getTasks());
    }

    openEditForm(taskId) {
        const task = this.model.tasks.find(task => task.id === taskId);

        if (!task) {
            console.warn('Task not found');
            return;
        }

        this.model.currentTaskData = {
            id: task.id,
            title: task.title,
            description: task.description,
            category: task.category
        };

        this.handleModalAction('newTask');

        const { titleInput, descriptionInput, categorySelect } = this.getInputs();

        if (titleInput) titleInput.value = task.title;
        if (descriptionInput) {
            descriptionInput.value = task.description;
            descriptionInput.style.display = 'block';
        }
        if (categorySelect) categorySelect.value = task.category.id;
    }

    controlDescription() {
        this.view.switchDecsription();
    }

    closeModal(modalId) {
        this.view.modalFactory.hide(modalId);
        this.history = this.history.filter(id => id !== modalId);
        this.resetForm();
    }

    resetForm() {

        const { titleInput, descriptionInput, categorySelect } = this.getInputs();
        if (titleInput) titleInput.value = '';
        if (descriptionInput) {
            descriptionInput.value = '';
            descriptionInput.style.display = 'none';
        }
        if (categorySelect) categorySelect.value = '';

        this.model.currentTaskData = {
            title: '',
            category: '',
            description: ''
        };
    }

    getInputs() {
        const titleInput = document.querySelector('[data-input="title"]');
        const descriptionInput = document.querySelector('[data-input="description"]');
        const categorySelect = document.querySelector('[data-input="category"]');
        return { titleInput, descriptionInput, categorySelect };
    }

    closeCurrentModal() {
        if (this.history.length > 0) {
            const lastModal = this.history.pop();
            this.closeModal(lastModal);
        }
    }

    closeModalByElement(element) {
        const modal = element.closest('.modal');
        if (!modal) return;

        const modalId = modal.id || Array.from(modal.classList)
            .find(cls => cls.startsWith('modal-'))
            ?.replace('modal-', '');

        if (modalId) this.closeModal(modalId);

        if (modalId === 'profileData') {
            this.toggleProfileElements(true);
            this.closeModal('avatarChose');
            this.makeCloseBackgroundBlock()
        }
        if (modalId === 'newTask') {
            this.makeCloseBackgroundBlock();
        }
    }


    handleEditProfile() {
        if (!this.isEditing) {
            const data = this.model.getProfileData();
            this.updateProfileUI(this.PROFILE_STATES.EDIT, data);
            this.isEditing = true;
            return;
        }

        const profileData = this.getProfileFormData();
        if (!this.validateProfileData(profileData)) return;

        this.model.updateProfile(profileData)
            .then(() => {
                const newData = this.model.getProfileData();
                this.updateProfileUI(this.PROFILE_STATES.VIEW, newData);
                this.isEditing = false;
            })
            .catch(error => {
                console.error('Ошибка обновления:', error);
            });

    }

    getProfileFormData() {
        return {
            name: document.querySelector('.my-profile-name .input')?.value || '',
            birthDate: document.querySelector('.my-profile-birthdate .input')?.value || ''
        };
    }

    updateProfileUI(state, data) {
        console.log('drawed')
        switch (state) {
            case this.PROFILE_STATES.EMPTY:
                this.showEmptyState();
                break;
            case this.PROFILE_STATES.VIEW:
                this.showViewState(data);
                break;
            case this.PROFILE_STATES.EDIT:
                this.showEditState(data);
                break;
        }
    }


    setPlaceholders() {
        console.log('setted')
    }

    showEmptyState() {
        this.toggleProfileElements(false);
        this.setPlaceholders();
        this.setEditButtonText('Подтвердить');
    }

    showViewState(data) {
        this.updateTextFields(data);
        this.toggleProfileElements(true);
        this.setEditButtonText('Редактировать');

    }

    showEditState(data) {
        this.fillInputs(data);
        this.toggleProfileElements(false);
        this.setEditButtonText('Сохранить');
        clearInterval(this.interval);
    }

    toggleProfileElements(showText) {
        this.getProfileFields().forEach(({ text, input }) => {
            this.toggleElementVisibility(text, showText);
            this.toggleElementVisibility(input, !showText);
        });
    }

    fillInputs(data) {
        this.getProfileFields().forEach(({ input }, index) => {
            if (input) {
                input.value = Object.values(data)[index] || '';
            }
        });
    }

    toggleFields(enable) {
        this.getProfileFields().forEach(({ text, input }) => {
            if (text && input) {
                this.toggleElementVisibility(text, !enable);
                this.toggleElementVisibility(input, enable);
                if (enable) {
                    input.value = text?.textContent || '';
                }
            }
        });
    }

    getProfileFields() {
        return [
            {
                text: document.querySelector('.my-profile-name .text'),
                input: document.querySelector('.my-profile-name .input')
            },
            {
                text: document.querySelector('.my-profile-birthdate .text'),
                input: document.querySelector('.my-profile-birthdate .input')
            }
        ];
    }

    toggleElementVisibility(element, visible) {
        if (!element) {
            console.warn('Попытка переключения несуществующего элемента');
            return;
        }

        element.classList.toggle('hidden', !visible);
    }

    validateProfileData(data) {
        if (!data) return false;

        const errors = [];

        if (!data.birthDate) {
            errors.push('Birth date is required');
        }

        if (errors.length > 0) {
            errors.forEach(error => console.warn(error));
            return false;
        }
        return true;
    }

    updateTextFields(data) {
        if (!data) return;

        this.getProfileFields().forEach(({ text }, index) => {
            const value = Object.values(data)[index] || '';
            if (text) text.textContent = value || this.getDefaultText(index);
        });
    }

    getDefaultText(index) {
        return index === 0 ? 'Пользователь' : '';
    }

    setEditButtonText(text) {
        const editButton = document.querySelector('[data-action="edit-profile"]');
        if (editButton) editButton.textContent = text;
    }

    handleUserVisibleData() {
        const data = this.model.getProfileData();
        const state = this.determineProfileState(data);
        this.updateProfileUI(state, data);

    }

    determineProfileState(data) {
        const hasData = data.name || data.birthDate;

        if (this.isEditing) return this.PROFILE_STATES.EDIT;
        return hasData ? this.PROFILE_STATES.VIEW : this.PROFILE_STATES.EMPTY;
    }

    setupPointsListener() {
        this.model.setupPointsListener((data) => {
            this.view.updateLvlProgress(data);

            if (data.level > this.currentLevel) {
                this.view.animateLevelUp(data.level);
                this.currentLevel = data.level;
            }
        });
    }

}