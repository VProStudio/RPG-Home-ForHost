export default class ModalFactory {
    constructor() {
        this.modals = new Map();
    }

    create(modalId, className, isControl, content = '') {
        const modal = document.createElement('div');
        modal.className = `modal ${className}`;
        modal.innerHTML = content;
        // modal.appendChild(this.createControlGroup());
        this.controlGoupSwitch(isControl, modal);
        document.body.appendChild(modal);
        this.modals.set(modalId, modal);
        return modal;
    }

    controlGoupSwitch(isControl, modal) {
        if (isControl === 'control') {
            modal.appendChild(this.createControlGroup());
        }
    }

    createControlGroup() {
        const controlGroup = document.createElement('div');
        controlGroup.appendChild(this.createCloseButton());
        controlGroup.className = 'control-group';
        return controlGroup;

    }

    createCloseButton() {
        const closeButton = document.createElement('button');
        closeButton.className = 'close';
        closeButton.textContent = `\u2715`;
        closeButton.setAttribute('data-action', 'close');
        return closeButton;
    }

    show(modalId) {
        const modal = this.modals.get(modalId);
        if (modal) modal.classList.add('active');
    }

    hide(modalId) {
        const modal = this.modals.get(modalId);
        if (modal) {
            modal.classList.remove('active');
            modal.setAttribute('hidden', '');
        }
    }

    getModal(modalId) {
        console.log(this.modals.get(modalId));
        return this.modals.get(modalId);
    }

    getAllModals() {
        return this.modals;
    }
}