import * as vscode from "vscode";

export interface PipelineTemplate {
  name: string;
  description: string;
  content: string;
}

export const templates: PipelineTemplate[] = [
  {
    name: "Hello World",
    description: "Simple job that prints hello world",
    content: `jobs:
- name: hello
  plan:
  - task: say-hello
    config:
      platform: linux
      image_resource:
        type: registry-image
        source: { repository: alpine }
      run:
        path: echo
        args: ["hello world"]
`,
  },
  {
    name: "Git Resource",
    description: "Clone a repo and run tests",
    content: `resources:
- name: my-repo
  type: git
  source:
    uri: https://github.com/user/repo.git
    branch: main

jobs:
- name: test
  plan:
  - get: my-repo
    trigger: true
  - task: run-tests
    config:
      platform: linux
      image_resource:
        type: registry-image
        source: { repository: node }
      inputs:
      - name: my-repo
      run:
        path: sh
        args:
        - -c
        - |
          cd my-repo
          npm install
          npm test
`,
  },
  {
    name: "Time Triggered",
    description: "Job that runs on a schedule",
    content: `resources:
- name: every-5m
  type: time
  source:
    interval: 5m

jobs:
- name: recurring-job
  plan:
  - get: every-5m
    trigger: true
  - task: do-something
    config:
      platform: linux
      image_resource:
        type: registry-image
        source: { repository: alpine }
      run:
        path: echo
        args: ["running on schedule"]
`,
  },
  {
    name: "Docker Build",
    description: "Build and push a Docker image",
    content: `resources:
- name: my-repo
  type: git
  source:
    uri: https://github.com/user/repo.git
    branch: main

- name: my-image
  type: registry-image
  source:
    repository: myregistry/myimage
    username: ((registry-username))
    password: ((registry-password))

jobs:
- name: build-and-push
  plan:
  - get: my-repo
    trigger: true
  - task: build-image
    privileged: true
    config:
      platform: linux
      image_resource:
        type: registry-image
        source: { repository: concourse/oci-build-task }
      inputs:
      - name: my-repo
        path: .
      outputs:
      - name: image
      run:
        path: build
  - put: my-image
    params:
      image: image/image.tar
`,
  },
  {
    name: "Multi-Job Pipeline",
    description: "Pipeline with build, test and deploy stages",
    content: `resources:
- name: my-repo
  type: git
  source:
    uri: https://github.com/user/repo.git
    branch: main

jobs:
- name: build
  plan:
  - get: my-repo
    trigger: true
  - task: compile
    config:
      platform: linux
      image_resource:
        type: registry-image
        source: { repository: golang }
      inputs:
      - name: my-repo
      outputs:
      - name: built
      run:
        path: sh
        args:
        - -c
        - |
          cd my-repo
          go build -o ../built/app .

- name: test
  plan:
  - get: my-repo
    trigger: true
    passed: [build]
  - task: run-tests
    config:
      platform: linux
      image_resource:
        type: registry-image
        source: { repository: golang }
      inputs:
      - name: my-repo
      run:
        path: sh
        args:
        - -c
        - |
          cd my-repo
          go test ./...

- name: deploy
  plan:
  - get: my-repo
    trigger: true
    passed: [test]
  - task: deploy
    config:
      platform: linux
      image_resource:
        type: registry-image
        source: { repository: alpine }
      inputs:
      - name: my-repo
      run:
        path: echo
        args: ["deploying..."]
`,
  },
];

export class TemplateTreeItem extends vscode.TreeItem {
  constructor(public readonly template: PipelineTemplate) {
    super(template.name, vscode.TreeItemCollapsibleState.None);
    this.tooltip = template.description;
    this.description = template.description;
    this.contextValue = "template";
    this.iconPath = new vscode.ThemeIcon("file-code");
    this.command = {
      command: "concourse.applyTemplate",
      title: "Apply Template",
      arguments: [template],
    };
  }
}

export class TemplateProvider implements vscode.TreeDataProvider<TemplateTreeItem> {
  getTreeItem(element: TemplateTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(): Promise<TemplateTreeItem[]> {
    return templates.map((t) => new TemplateTreeItem(t));
  }
}
