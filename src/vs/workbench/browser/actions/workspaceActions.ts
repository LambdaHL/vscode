/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'vs/base/common/actions';
import * as nls from 'vs/nls';
import { IWindowService } from 'vs/platform/windows/common/windows';
import { ITelemetryData } from 'vs/platform/telemetry/common/telemetry';
import { IWorkspaceContextService, WorkbenchState, IWorkspaceFolder } from 'vs/platform/workspace/common/workspace';
import { IWorkspaceEditingService } from 'vs/workbench/services/workspace/common/workspaceEditing';
import { IWorkspacesService } from 'vs/platform/workspaces/common/workspaces';
import { IEditorService } from 'vs/workbench/services/editor/common/editorService';
import { ICommandService } from 'vs/platform/commands/common/commands';
import { ADD_ROOT_FOLDER_COMMAND_ID, ADD_ROOT_FOLDER_LABEL, PICK_WORKSPACE_FOLDER_COMMAND_ID } from 'vs/workbench/browser/actions/workspaceCommands';
import { IFileDialogService } from 'vs/platform/dialogs/common/dialogs';
import { INotificationService } from 'vs/platform/notification/common/notification';

export class OpenFileAction extends Action {

	static readonly ID = 'workbench.action.files.openFile';
	static LABEL = nls.localize('openFile', "Open File...");

	constructor(
		id: string,
		label: string,
		@IFileDialogService private readonly dialogService: IFileDialogService
	) {
		super(id, label);
	}

	run(event?: any, data?: ITelemetryData): Promise<any> {
		return this.dialogService.pickFileAndOpen({ forceNewWindow: false, telemetryExtraData: data });
	}
}

export class OpenFolderAction extends Action {

	static readonly ID = 'workbench.action.files.openFolder';
	static LABEL = nls.localize('openFolder', "Open Folder...");

	constructor(
		id: string,
		label: string,
		@IFileDialogService private readonly dialogService: IFileDialogService
	) {
		super(id, label);
	}

	run(event?: any, data?: ITelemetryData): Promise<any> {
		return this.dialogService.pickFolderAndOpen({ forceNewWindow: false, telemetryExtraData: data });
	}
}

export class OpenFileFolderAction extends Action {

	static readonly ID = 'workbench.action.files.openFileFolder';
	static LABEL = nls.localize('openFileFolder', "Open...");

	constructor(
		id: string,
		label: string,
		@IFileDialogService private readonly dialogService: IFileDialogService
	) {
		super(id, label);
	}

	run(event?: any, data?: ITelemetryData): Promise<any> {
		return this.dialogService.pickFileFolderAndOpen({ forceNewWindow: false, telemetryExtraData: data });
	}
}

export class AddRootFolderAction extends Action {

	static readonly ID = 'workbench.action.addRootFolder';
	static LABEL = ADD_ROOT_FOLDER_LABEL;

	constructor(
		id: string,
		label: string,
		@ICommandService private readonly commandService: ICommandService
	) {
		super(id, label);
	}

	run(): Promise<any> {
		return this.commandService.executeCommand(ADD_ROOT_FOLDER_COMMAND_ID);
	}
}

export class GlobalRemoveRootFolderAction extends Action {

	static readonly ID = 'workbench.action.removeRootFolder';
	static LABEL = nls.localize('globalRemoveFolderFromWorkspace', "Remove Folder from Workspace...");

	constructor(
		id: string,
		label: string,
		@IWorkspaceEditingService private readonly workspaceEditingService: IWorkspaceEditingService,
		@IWorkspaceContextService private readonly contextService: IWorkspaceContextService,
		@ICommandService private readonly commandService: ICommandService
	) {
		super(id, label);
	}

	run(): Promise<any> {
		const state = this.contextService.getWorkbenchState();

		// Workspace / Folder
		if (state === WorkbenchState.WORKSPACE || state === WorkbenchState.FOLDER) {
			return this.commandService.executeCommand<IWorkspaceFolder>(PICK_WORKSPACE_FOLDER_COMMAND_ID).then(folder => {
				if (folder) {
					return this.workspaceEditingService.removeFolders([folder.uri]).then(() => true);
				}

				return true;
			});
		}

		return Promise.resolve(true);
	}
}

export class SaveWorkspaceAsAction extends Action {

	static readonly ID = 'workbench.action.saveWorkspaceAs';
	static LABEL = nls.localize('saveWorkspaceAsAction', "Save Workspace As...");

	constructor(
		id: string,
		label: string,
		@IWorkspaceContextService private readonly contextService: IWorkspaceContextService,
		@IWorkspaceEditingService private readonly workspaceEditingService: IWorkspaceEditingService

	) {
		super(id, label);
	}

	run(): Promise<any> {
		return this.workspaceEditingService.pickNewWorkspacePath().then((configPathUri): Promise<void> | void => {
			if (configPathUri) {
				switch (this.contextService.getWorkbenchState()) {
					case WorkbenchState.EMPTY:
					case WorkbenchState.FOLDER:
						const folders = this.contextService.getWorkspace().folders.map(folder => ({ uri: folder.uri }));
						return this.workspaceEditingService.createAndEnterWorkspace(folders, configPathUri);

					case WorkbenchState.WORKSPACE:
						return this.workspaceEditingService.saveAndEnterWorkspace(configPathUri);
				}
			}
		});
	}
}

export class OpenWorkspaceAction extends Action {

	static readonly ID = 'workbench.action.openWorkspace';
	static LABEL = nls.localize('openWorkspaceAction', "Open Workspace...");

	constructor(
		id: string,
		label: string,
		@IFileDialogService private readonly dialogService: IFileDialogService
	) {
		super(id, label);
	}

	run(event?: any, data?: ITelemetryData): Promise<any> {
		return this.dialogService.pickWorkspaceAndOpen({ telemetryExtraData: data });
	}
}

export class CloseWorkspaceAction extends Action {

	static readonly ID = 'workbench.action.closeFolder';
	static LABEL = nls.localize('closeWorkspace', "Close Workspace");

	constructor(
		id: string,
		label: string,
		@IWorkspaceContextService private readonly contextService: IWorkspaceContextService,
		@INotificationService private readonly notificationService: INotificationService,
		@IWindowService private readonly windowService: IWindowService
	) {
		super(id, label);
	}

	run(): Promise<void> {
		if (this.contextService.getWorkbenchState() === WorkbenchState.EMPTY) {
			this.notificationService.info(nls.localize('noWorkspaceOpened', "There is currently no workspace opened in this instance to close."));

			return Promise.resolve(undefined);
		}

		return this.windowService.closeWorkspace();
	}
}

export class OpenWorkspaceConfigFileAction extends Action {

	static readonly ID = 'workbench.action.openWorkspaceConfigFile';
	static readonly LABEL = nls.localize('openWorkspaceConfigFile', "Open Workspace Configuration File");

	constructor(
		id: string,
		label: string,
		@IWorkspaceContextService private readonly workspaceContextService: IWorkspaceContextService,
		@IEditorService private readonly editorService: IEditorService
	) {
		super(id, label);

		this.enabled = !!this.workspaceContextService.getWorkspace().configuration;
	}

	run(): Promise<any> {
		const configuration = this.workspaceContextService.getWorkspace().configuration;
		if (configuration) {
			return this.editorService.openEditor({ resource: configuration });
		}
		return Promise.resolve();
	}
}

export class DuplicateWorkspaceInNewWindowAction extends Action {

	static readonly ID = 'workbench.action.duplicateWorkspaceInNewWindow';
	static readonly LABEL = nls.localize('duplicateWorkspaceInNewWindow', "Duplicate Workspace in New Window");

	constructor(
		id: string,
		label: string,
		@IWorkspaceContextService private readonly workspaceContextService: IWorkspaceContextService,
		@IWorkspaceEditingService private readonly workspaceEditingService: IWorkspaceEditingService,
		@IWindowService private readonly windowService: IWindowService,
		@IWorkspacesService private readonly workspacesService: IWorkspacesService
	) {
		super(id, label);
	}

	run(): Promise<any> {
		const folders = this.workspaceContextService.getWorkspace().folders;
		const remoteAuthority = this.windowService.getConfiguration().remoteAuthority;

		return this.workspacesService.createUntitledWorkspace(folders, remoteAuthority).then(newWorkspace => {
			return this.workspaceEditingService.copyWorkspaceSettings(newWorkspace).then(() => {
				return this.windowService.openWindow([{ uri: newWorkspace.configPath, typeHint: 'file' }], { forceNewWindow: true });
			});
		});
	}
}
