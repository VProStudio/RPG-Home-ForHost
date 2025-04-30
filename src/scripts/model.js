import {
    getAuth,
    signOut,
    signInWithPopup,
    onAuthStateChanged,
    GoogleAuthProvider,
    sendEmailVerification,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
} from "./firebase/auth";
import {
    getFirestore,
    serverTimestamp,
    onSnapshot,
    collection,
    FieldValue,
    increment,
    deleteDoc,
    updateDoc,
    getDocs,
    orderBy,
    getDoc,
    setDoc,
    addDoc,
    where,
    query,
    limit,
    doc,
} from './firebase/firestore';

export class Model {
    constructor(view) {
        this.view = view;
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.currentTaskData = { title: '', category: '', description: '' };
        this.originalTasks = this.tasks;
        this.auth = getAuth();
        this.profileData = {};
        this.db = getFirestore();
        this.categories = [
            { id: 1, name: "Мытье", difficulty: 10 },
            { id: 2, name: "Пылесос", difficulty: 10 },
            { id: 3, name: "Сан. обработка", difficulty: 10 },
            { id: 4, name: "Глажка", difficulty: 20 },
            { id: 5, name: "Стирка", difficulty: 20 },
            { id: 6, name: "Перестановка", difficulty: 30 },
            { id: 7, name: "Ремонт", difficulty: 40 },
            { id: 8, name: "Полировка", difficulty: 40 }
        ];
        this.BASE_XP = 1000;
        this.GROWTH_RATE = 1.5;
    }

    initializeAuth() {
        return new Promise((resolve, reject) => {
            const authStateHandler = async (user) => {
                try {
                    if (user) {
                        await this.#handleAuthenticatedUser(user);
                        resolve(user);
                    } else {
                        this.#handleUnauthenticatedUser();
                        resolve(null);
                    }
                } catch (error) {
                    this.#handleAuthError(error);
                    reject(error);
                }
            };

            const errorHandler = (error) => {
                this.#handleAuthError(error);
                reject(error);
            };

            onAuthStateChanged(this.auth, authStateHandler, errorHandler);
        });
    }

    #handleAuthenticatedUser = async (user) => {
        this.#resetUserState();
        this.user = user;

        await Promise.all([
            this.loadProfileData(),
            this.fetchTasks()
        ]);

        this.setupTasksListener();
        this.setAuthCookies(user);
        this.#initializeUserSession();
    };

    #handleUnauthenticatedUser = () => {
        this.#resetUserState();
        this.clearAuthCookies();
        this.view.showBackgroundBlock();
    };

    #resetUserState = () => {
        this.tasks = [];
        this.profileData = {};
        if (this.tasksUnsubscribe) {
            this.tasksUnsubscribe();
            this.tasksUnsubscribe = null;
        }
    };

    #initializeUserSession = () => {
        this.clarifyIdentity();
        this.loadAvatar();
        this.view.hideBackgroundBlock();
    };

    #handleAuthError = (error) => {
        console.error('Auth state error:', error);
        this.clearAuthCookies();
        this.#resetUserState();
        this.view.showErrorToast('Ошибка авторизации!');
    };

    setAuthCookies(user, token) {
        if (token === undefined) {
            token = user.accessToken;
        }
        document.cookie = `authToken=${token}; path=/; max-age=3600; Secure; SameSite=Strict`;
        document.cookie = `userId=${user.uid}; path=/; max-age=3600; Secure; SameSite=Strict`;
    }

    clearAuthCookies() {
        document.cookie = 'authToken=; path=/; max-age=0';
        document.cookie = 'userId=; path=/; max-age=0';
        this.removeGogleAvatarCookie();
    }

    handleCategorySelector() {
        const select = this.view.getCategorySelect();
        this.view.createOption(select, this.categories);
    }

    getTasks() {
        return this.tasks;
    }

    getTask(taskId) {
        return this.tasks.find(task => task.id === taskId);
    }

    async loadAchievementsProgress() {
        try {
            const user = this.auth.currentUser;
            if (!user) return [];

            const q = query(collection(this.db, 'users', user.uid,
                'achievements_progress'));
            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Ошибка загрузки прогресса:', error);
            return [];
        }
    }

    async unlockAchievement(achievementName) {
        try {
            const user = this.auth.currentUser;
            if (!user) {
                console.error('Пользователь не аутентифицирован');
                return;
            }

            const achievementRef = doc(
                this.db,
                'users',
                user.uid,
                'achievements',
                achievementName.toLowerCase().replace(/\s/g, '_')
            );

            await setDoc(achievementRef, {
                name: achievementName,
                progress: 100,
                unlockedAt: serverTimestamp(),
                categoryId: this.getCategoryIdByName(achievementName)
            }, { merge: true });

            console.log(`[DEBUG] Достижение "${achievementName}" сохранено!`);
        } catch (error) {
            console.error('[ERROR] Ошибка сохранения:', error);
        }
    }

    async updateAchievementProgress(achievementName, categoryId, incrementValue = 1) {
        try {
            const user = this.auth.currentUser;
            if (!user) return;

            const achievementId = achievementName.toLowerCase().replace(/\s/g, '_');
            const progressRef = doc(this.db, 'users', user.uid,
                'achievements_progress', achievementId);

            const docSnap = await getDoc(progressRef);

            if (docSnap.exists()) {
                await updateDoc(progressRef, {
                    current: incrementValue === 0 ? 0 : increment(incrementValue)
                });
            } else {
                await setDoc(progressRef, {
                    name: achievementName,
                    categoryId: categoryId,
                    target: 10,
                    current: incrementValue,
                    createdAt: serverTimestamp()
                });
            }

            console.log(`Прогресс для "${achievementName}" обновлен`);
        } catch (error) {
            console.error('Ошибка обновления прогресса:', error);
        }
    }

    async checkAndUnlockAchievement(achievementName, categoryId) {
        try {
            const user = this.auth.currentUser;
            if (!user) return;

            const achievementId = achievementName.toLowerCase().replace(/\s/g, '_');
            const progressRef = doc(this.db, 'users', user.uid,
                'achievements_progress', achievementId);
            const unlockedRef = doc(this.db, 'users', user.uid,
                'achievements_unlocked', achievementId);

            const progressSnap = await getDoc(progressRef);

            if (progressSnap.exists() && progressSnap.data().current >= 10) {
                await setDoc(unlockedRef, {
                    name: achievementName,
                    categoryId: categoryId,
                    unlockedAt: serverTimestamp()
                });

                await deleteDoc(progressRef);
                console.log(`Достижение "${achievementName}" разблокировано!`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Ошибка разблокировки:', error);
            return false;
        }
    }

    async getTotalTasks() {
        try {
            const user = this.auth.currentUser;
            if (!user) return 0;

            const tasksRef = collection(this.db, 'users', user.uid, 'tasks');
            const snapshot = await getDocs(tasksRef);
            return snapshot.size;
        } catch (error) {
            console.error('Ошибка получения задач:', error);
            return 0;
        }
    }

    async fetchTasks() {
        try {
            const user = this.auth.currentUser;
            if (!user) {
                this.tasks = [];
                return;
            }

            const userTasksRef = collection(this.db, 'users', user.uid, 'tasks');
            const querySnapshot = await getDocs(userTasksRef);

            this.tasks = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Ошибка загрузки задач:', error);
            this.tasks = [];
        }
    }

    async addTask(task) {
        try {
            const user = this.auth.currentUser;
            if (!user) return;

            const userTasksRef = collection(this.db, 'users', user.uid, 'tasks');

            const docRef = await addDoc(userTasksRef, {
                ...task,
                createdAt: serverTimestamp()
            });

            this.tasks.push({ id: docRef.id, ...task });
        } catch (error) {
            console.error('Ошибка добавления задачи:', error);
        }
    }

    async updateTask(taskId, updates) {
        try {
            const user = this.auth.currentUser;
            await updateDoc(doc(this.db, 'users', user.uid, 'tasks', taskId), updates);

            this.tasks = this.tasks.map(task =>
                task.id === taskId ? { ...task, ...updates } : task
            );
        } catch (error) {
            console.error('Ошибка обновления задачи:', error);
        }
    }

    async deleteTask(taskId) {
        try {
            const user = this.auth.currentUser;
            await deleteDoc(doc(this.db, 'users', user.uid, 'tasks', taskId));

            this.tasks = this.tasks.filter(task => task.id !== taskId);
        } catch (error) {
            console.error('Ошибка удаления задачи:', error);
        }
    }

    setupTasksListener() {
        const user = this.auth.currentUser;
        const userTasksRef = collection(this.db, 'users', user.uid, 'tasks');

        this.tasksUnsubscribe = onSnapshot(userTasksRef, (snapshot) => {
            this.tasks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            this.originalTasks = [...this.tasks];
            this.view.renderTasks(this.tasks);
        });
    }

    save() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    sortTasks(target) {
        const tasksToSort = [...this.tasks];

        if (target === 'date') {
            tasksToSort.sort((a, b) => b.createdAt - a.createdAt);
        } else if (target === 'alphabet') {
            tasksToSort.sort((a, b) => a.title.localeCompare(b.title));
        }

        this.tasks = tasksToSort;
    }

    filterTasks(target) {
        let filteredTasks = [...this.originalTasks];

        if (target === 'completed') {
            filteredTasks = filteredTasks.filter(task => task.completed);
        } else if (target === 'incomplete') {
            filteredTasks = filteredTasks.filter(task => !task.completed);
        }

        this.tasks = filteredTasks;
    }

    getDifficulty(task) {
        const taskCategoryId = Number(task.category.id);
        const category = this.categories.find(cat => cat.id === taskCategoryId);
        return category?.difficulty || 0;
    }

    async updateUserPoints(pointsDelta) {
        try {
            const user = this.auth.currentUser;
            const currentPoints = this.profileData.points || 0;
            const newPoints = currentPoints + pointsDelta;

            await updateDoc(doc(this.db, 'users', user.uid), {
                points: newPoints
            });

            this.profileData.points = newPoints;
            this.view.updatePointsDisplay(newPoints);
        } catch (error) {
            console.error("Ошибка обновления очков:", error);
        }
    }

    onTaskUpdated(callback) {
        const q = query(collection(this.db, 'users', this.user.uid, 'tasks'));
        return onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'modified') callback(change.doc.data());
            });
        });
    }

    async getCompletedTaskCount(categoryId) {
        const q = query(
            collection(this.db, 'users', this.user.uid, 'tasks'),
            where('category.id', '==', categoryId),
            where('completed', '==', true)
        );
        const snapshot = await getDocs(q);
        return snapshot.size;
    }

    handleRegistration(email, password) {
        const auth = getAuth();
        createUserWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {
                const user = userCredential.user;

                await setDoc(doc(this.db, 'users', user.uid), {
                    name: user.email.split('@')[0],
                    avatarUrl: ''
                });
                return sendEmailVerification(user, {
                    url: window.location.origin
                });
            })
            .then(() => {
                console.log('Письмо отправлено');
            })
            .catch((error) => {
                console.error("Ошибка:", error.code, error.message);
            });
    }

    handleLogin(email, password) {
        const auth = getAuth();
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                if (!user.emailVerified) {
                    throw new Error("Подтвердите email перед входом");
                }

                return user.getIdToken().then(token => ({ user, token }));
            })
            .then(({ user, token }) => {
                this.setAuthCookies(user, token);
                console.log('Вход выполнен');
                this.view.renderAuthorisation();
            })
            .catch((error) => {
                console.error("Ошибка:", error.message);
                this.view.showErrorToast("Ошибка:", error.message)
            });
    }

    joinWithGoogle() {
        const auth = getAuth();
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider)
            .then((result) => {
                const user = result.user;
                const avatarUrl = user.photoURL;
                return user.getIdToken().then(token => ({ user, token, avatarUrl }));
            })
            .then(({ user, token, avatarUrl }) => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve({ user, token, avatarUrl });
                    }, 1500);
                });
            })
            .then(({ user, token, avatarUrl }) => {
                this.setAuthCookies(user, token);
                this.handleRenderAuthorisation(user, avatarUrl);
                this.checkGoogleUser(avatarUrl);
                this.view.renderAvatar(avatarUrl);
                setDoc(doc(this.db, 'users', user.uid), {
                    name: user.displayName,
                    avatarUrl: user.photoURL
                }, { merge: true });
            })
            .catch((error) => {
                console.error("Ошибка входа:", error.code, error.message);
                let message = "Ошибка входа через Google";
                if (error.code === "auth/popup-closed-by-user") {
                    message = "Окно входа было закрыто";
                }
                this.view.showErrorToast("Ошибка авторизации:");
            });
    }

    handleRenderAuthorisation() {
        this.view.renderAuthorisation();
    }

    saveAvatarUrl(avatarUrl) {
        const avatar = this.wrapAvatarUrl(avatarUrl);
        this.updateProfile(avatar);
    }

    wrapAvatarUrl(avatarUrl) {
        return {
            avatarUrl: avatarUrl
        }
    }

    async checkGoogleFlag() {
        try {
            const user = this.auth.currentUser;
            if (!user) return false;

            const docRef = doc(this.db, 'users', user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                console.log('data', data);
                return data.googleRef || false;
            }
            return false;
        } catch (error) {
            console.error('Error getting flag:', error);
            return false;
        }
    }

    setGoogleRefFlag() {
        this.updateProfile({ googleRef: true });
    }

    checkGoogleRef(url) {
        const refWord = 'googleusercontent';
        return url.includes(refWord);
    }

    setGogleAvatarCookie(url) {
        document.cookie = `googleAvatar=${url}; path=/; max-age=0; path=/; max-age=3600; Secure; SameSite=Strict`;
    }

    getGoogleAvatarCookie() {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; googleAvatar=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    removeGogleAvatarCookie() {
        document.cookie = 'googleAvatar=; path=/; max-age=0';
    }

    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    isAuthenticated() {
        return this.getCookie('authToken') !== undefined;
    }


    isEmailValid(email) {
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    }


    isPasswordValid(password) {
        return password.length >= 6;
    }

    logout() {
        const auth = getAuth();
        signOut(auth).then(() => {
            this.clearAuthCookies();
            this.profileData = {};
            this.tasks = [];
            this.originalTasks = [];
            localStorage.removeItem('tasks');
            console.log('User signed out');
        }).catch((error) => {
            console.warn('Logout error:', error);
        });
        if (this.tasksUnsubscribe) {
            this.tasksUnsubscribe();
        }
        this.view.removeAllActiveElements();
        this.view.showAuthModal();
        this.view.showBackgroundBlock();
    }



    clarifyIdentity() {
        const auth = getAuth();
        const user = auth.currentUser;
        if (user !== null) {
            user.providerData.forEach((profile) => {
                console.log("  Name:", profile.displayName || 'Пользователь');
                console.log("  Email: " + profile.email);
            });
        }
    }


    checkGoogleUser(avatarUrl) {
        return new Promise((resolve, reject) => {
            try {
                const user = this.auth.currentUser;
                if (!user) return resolve('not found');
                const docRef = doc(this.db, 'users', user.uid);
                getDoc(docRef).then((docSnap) => {
                    if (!docSnap.exists() || !docSnap.data().googleRef) {
                        this.setGoogleRefFlag();
                        this.saveAvatarUrl(avatarUrl);
                        console.log('new user');
                    }
                    this.setGoogleRefFlag();
                    this.setGogleAvatarCookie(avatarUrl);
                    resolve();
                }).catch((error) => {
                    console.error('Error getting user document:', error);
                    reject(error);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    loadAvatar() {
        return new Promise((resolve, reject) => {
            try {
                const user = this.auth.currentUser;

                if (!user) {
                    console.log('No user found');
                    resolve('no avatar');
                    return;
                }
                const docRef = doc(this.db, 'users', user.uid);

                getDoc(docRef)
                    .then((docSnap) => {
                        if (!docSnap.exists()) {
                            console.log('No user document found');
                            resolve('no avatar');
                            return;
                        }
                        const userData = docSnap.data();
                        if (!userData.avatarUrl) {
                            console.log('No avatar URL in user data');
                            resolve('no avatar');
                            return;
                        }
                        this.handleRenderAvatar(userData.avatarUrl);
                        resolve(userData.avatarUrl);
                    })
                    .catch((error) => {
                        console.error('Error getting user document:', error);
                        reject(error);
                    });

            } catch (error) {
                console.error('Error in loadAvatar:', error);
                reject(error);
            }
        });
    }

    handleRenderAvatar(avatarUrl) {
        this.view.renderAvatar(avatarUrl);
    }

    async loadProfileData(onComplete) {
        try {
            const user = this.auth.currentUser;
            if (!user) return;

            const docRef = doc(this.db, 'users', user.uid);
            const docSnap = await getDoc(docRef);

            this.profileData = docSnap.exists() ? docSnap.data() : {};
            this.profileData.points = this.profileData.points || 0;
            console.log('Данные профиля загружены:', this.profileData);
            const progressData = {
                level: this.getLevel,
                progress: this.getProgress,
                currentXP: this.profileData.points,
                nextLevelXP: this.getNextLevelXP
            };

            this.view.updateLvlProgress(progressData);
            this.view.updatePointsDisplay(this.profileData.points)
            if (onComplete) onComplete();
        } catch (error) {
            console.error('Ошибка загрузки профиля:', error);
            this.profileData = {};
        }
    }

    getProfileData() {
        return {
            name: this.profileData?.name || this.user?.displayName || 'Пользователь',
            birthDate: this.profileData?.birthDate || '',
            avatarUrl: this.profileData?.avatarUrl || 'no avatar'
        };
    }

    async updateProfile(data) {
        try {
            await setDoc(doc(this.db, 'users', this.user.uid), data, { merge: true });

            await this.loadProfileData();
        } catch (error) {
            console.error("Ошибка обновления профиля:", error);
        }
    }

    async updateLadder() {
        try {
            const users = await this.getUsersForLadder();
            this.view.renderLadder(users);
        } catch (error) {
            console.error("Ошибка обновления топа:", error);
        }
    }

    async getUsersForLadder() {
        try {
            const usersRef = collection(this.db, 'users');
            const usersQuery = query(
                usersRef,
                orderBy('points', 'desc'),
                limit(10)
            );

            const snapshot = await getDocs(usersQuery);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name || "Аноним",
                points: doc.data().points || 0
            }));
        } catch (error) {
            console.error("Ошибка загрузки топа:", error);
            return [];
        }
    }

    calculateLevel(points) {
        if (points < this.BASE_XP) return 1;
        return Math.floor(
            Math.log(points / this.BASE_XP) / Math.log(this.GROWTH_RATE) + 2
        );
    }

    getLevelRange(level) {
        const min = this.BASE_XP * Math.pow(this.GROWTH_RATE, level - 1);
        const max = this.BASE_XP * Math.pow(this.GROWTH_RATE, level);
        return { min, max };
    }

    getLevel() {
        return this.calculateLevel(this.profileData.points || 0);
    }

    getProgress() {
        const points = this.profileData.points || 0;
        const level = this.getLevel();

        if (level === 1) {
            return (points / this.BASE_XP) * 100;
        }

        const { min } = this.getLevelRange(level);
        const range = this.BASE_XP * Math.pow(this.GROWTH_RATE, level - 1);
        return ((points - min) / range) * 100;
    }

    getNextLevelXP() {
        const level = this.getLevel();
        const max = this.BASE_XP * (Math.pow(this.GROWTH_RATE, level) - 1);
        return max - this.profileData.points;
    }

    async addPoints(amount) {
        try {
            const user = this.auth.currentUser;
            if (!user) return;

            await updateDoc(doc(this.db, 'users', user.uid), {
                points: increment(amount)
            });
        } catch (error) {
            console.error("Ошибка обновления очков:", error);
        }
    }

    setupPointsListener(callback) {
        const user = this.auth.currentUser;
        if (!user) return;

        return onSnapshot(doc(this.db, 'users', user.uid), (doc) => {
            if (doc.exists) {
                const points = doc.data().points || 0;


                const level = this.getLevel();
                const progress = this.getProgress();
                const nextLevelXP = this.getNextLevelXP();


                callback({
                    level: level,
                    progress: progress,
                    currentXP: points,
                    nextLevelXP: nextLevelXP
                });
            }
        });
    }


}   
