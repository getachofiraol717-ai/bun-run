/**
 * Docker Container Runtime & Emulator for MargeOS Sandbox Terminal
 * Provides container management (docker run, build, ps, stop, exec, logs, images)
 * and Dockerfile generation capabilities.
 */

export interface VirtualContainer {
  id: string;
  name: string;
  image: string;
  command: string;
  status: 'running' | 'exited' | 'paused';
  createdAt: string;
  ports: string;
  outputLogs: string[];
  environment: Record<string, string>;
  memoryUsageMB: number;
}

export interface ContainerImage {
  repository: string;
  tag: string;
  imageId: string;
  created: string;
  size: string;
}

export class DockerRuntime {
  private static instance: DockerRuntime | null = null;

  private containers: Map<string, VirtualContainer> = new Map();
  private images: ContainerImage[] = [
    { repository: 'margeos-sandbox', tag: 'latest', imageId: 'a8f192b4c5d6', created: '2 hours ago', size: '142MB' },
    { repository: 'node', tag: '20-alpine', imageId: 'f721e90a3b2c', created: '3 days ago', size: '178MB' },
    { repository: 'python', tag: '3.11-slim', imageId: 'c12d34e5f678', created: '1 week ago', size: '154MB' },
    { repository: 'alpine', tag: '3.19', imageId: 'e456f789a012', created: '2 weeks ago', size: '7.3MB' },
    { repository: 'ubuntu', tag: '22.04', imageId: 'b987c654d321', created: '1 month ago', size: '77.8MB' },
  ];

  private constructor() {
    // Seed default running sandbox container
    this.containers.set('margeos-core', {
      id: 'd8a391c2e4f0',
      name: 'margeos-core-sandbox',
      image: 'margeos-sandbox:latest',
      status: 'running',
      command: 'node /app/sandboxWorker.js',
      createdAt: 'About an hour ago',
      ports: '0.0.0.0:3000->3000/tcp',
      outputLogs: [
        'MargeOS Sandbox Container initializing...',
        'Isolated WebWorker process spawned with PID 1',
        'Virtual filesystem mounted at /workspace',
        'Container health check status: OK'
      ],
      environment: { NODE_ENV: 'sandbox', ISOLATED: 'true' },
      memoryUsageMB: 28.4
    });
  }

  public static getInstance(): DockerRuntime {
    if (!DockerRuntime.instance) {
      DockerRuntime.instance = new DockerRuntime();
    }
    return DockerRuntime.instance;
  }

  public async executeCommand(args: string[], virtualFsContent?: Record<string, string>): Promise<{ output: string; status: 'success' | 'error' }> {
    if (args.length === 0 || args[0] === 'help') {
      return {
        output: `Docker Container CLI Engine for MargeOS Sandbox:
  docker run <image> <cmd>  - Create and run a new container from an image
  docker ps [-a]            - List running or all virtual containers
  docker images             - List locally cached container images
  docker build -t <tag> .   - Build container image from Dockerfile
  docker stop <id/name>     - Stop a running container
  docker rm <id/name>       - Remove a container
  docker logs <id/name>     - Fetch logs of a container
  docker exec <id> <cmd>    - Run command inside container
  docker compose up         - Spawn docker compose stack`,
        status: 'success'
      };
    }

    const sub = args[0].toLowerCase();

    switch (sub) {
      case 'ps': {
        const showAll = args.includes('-a') || args.includes('--all');
        const list = Array.from(this.containers.values()).filter(c => showAll || c.status === 'running');

        if (list.length === 0) {
          return { output: 'CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS   PORTS   NAMES\n(no containers running)', status: 'success' };
        }

        let table = 'CONTAINER ID   IMAGE                    COMMAND                       CREATED          STATUS        PORTS                   NAMES\n';
        for (const c of list) {
          const id = c.id.substring(0, 12).padEnd(14);
          const img = c.image.padEnd(24);
          const cmd = (c.command.length > 28 ? c.command.substring(0, 25) + '...' : c.command).padEnd(29);
          const created = c.createdAt.padEnd(16);
          const st = c.status.padEnd(13);
          const ports = (c.ports || '-').padEnd(23);
          table += `${id}${img}${cmd}${created}${st}${ports}${c.name}\n`;
        }
        return { output: table.trimEnd(), status: 'success' };
      }

      case 'images': {
        let table = 'REPOSITORY           TAG        IMAGE ID       CREATED        SIZE\n';
        for (const img of this.images) {
          table += `${img.repository.padEnd(20)}${img.tag.padEnd(11)}${img.imageId.padEnd(15)}${img.created.padEnd(15)}${img.size}\n`;
        }
        return { output: table.trimEnd(), status: 'success' };
      }

      case 'run': {
        if (args.length < 2) {
          return { output: 'Error: "docker run" requires at least 1 argument (image name).\nUsage: docker run [OPTIONS] IMAGE [COMMAND]', status: 'error' };
        }

        const imageArg = args[1];
        const cmdIndex = args.findIndex((a, idx) => idx > 1 && !a.startsWith('-'));
        const containerCmd = cmdIndex !== -1 ? args.slice(cmdIndex).join(' ') : 'sh';

        // Execute quick container execution
        const id = Math.random().toString(36).substring(2, 14);
        const name = `sandbox-${imageArg.replace(/[:/]/g, '-')}-${id.substring(0, 4)}`;

        let execOutput = `[Docker Engine] Pulling image library ${imageArg} if not present...\n[Docker Engine] Digest: sha256:${id}e87a2c...\n[Docker Engine] Status: Downloaded newer image for ${imageArg}\n`;

        if (imageArg.includes('python')) {
          execOutput += `Python 3.11.8 (main, Feb 12 2024) [GCC 12.2.0] on linux\nExecuting command: ${containerCmd}\n`;
          if (containerCmd.includes('print') || containerCmd.includes('python')) {
            execOutput += `>>> Output: Container executed Python script successfully in isolated sandbox layer.\n`;
          } else {
            execOutput += `Command completed with exit code 0.`;
          }
        } else if (imageArg.includes('node')) {
          execOutput += `v20.11.1 (Node.js engine runtime in Docker container)\nExecuting command: ${containerCmd}\n`;
          execOutput += `>>> [Docker Container Node]: Process finished successfully.\n`;
        } else {
          execOutput += `Running '${containerCmd}' inside isolated container ${id.substring(0, 12)}...\nContainer execution finished with exit code 0.\n`;
        }

        const newContainer: VirtualContainer = {
          id,
          name,
          image: imageArg,
          command: containerCmd,
          status: 'running',
          createdAt: 'Just now',
          ports: '3000/tcp',
          outputLogs: execOutput.split('\n'),
          environment: { CONTAINER_RUNTIME: 'docker-margeos' },
          memoryUsageMB: 18.2
        };

        this.containers.set(id, newContainer);
        return { output: execOutput, status: 'success' };
      }

      case 'stop': {
        if (args.length < 2) return { output: 'Error: "docker stop" requires container ID or name.', status: 'error' };
        const target = args[1];
        const container = Array.from(this.containers.values()).find(c => c.id.startsWith(target) || c.name === target);

        if (!container) return { output: `Error: No such container: ${target}`, status: 'error' };
        container.status = 'exited';
        return { output: `${container.id.substring(0, 12)} (Container ${container.name} stopped)`, status: 'success' };
      }

      case 'rm': {
        if (args.length < 2) return { output: 'Error: "docker rm" requires container ID or name.', status: 'error' };
        const target = args[1];
        const key = Array.from(this.containers.keys()).find(k => k.startsWith(target) || this.containers.get(k)?.name === target);

        if (!key) return { output: `Error: No such container: ${target}`, status: 'error' };
        this.containers.delete(key);
        return { output: `Removed container ${target}`, status: 'success' };
      }

      case 'logs': {
        if (args.length < 2) return { output: 'Error: "docker logs" requires container ID or name.', status: 'error' };
        const target = args[1];
        const container = Array.from(this.containers.values()).find(c => c.id.startsWith(target) || c.name === target);

        if (!container) return { output: `Error: No such container: ${target}`, status: 'error' };
        return { output: container.outputLogs.join('\n'), status: 'success' };
      }

      case 'build': {
        const tagIndex = args.indexOf('-t');
        const tag = tagIndex !== -1 && args[tagIndex + 1] ? args[tagIndex + 1] : 'custom-sandbox:latest';

        const buildLog = `[+] Building 1.8s (7/7) FINISHED
 => [internal] load build definition from Dockerfile
 => => transferring dockerfile: 382B
 => [internal] load .dockerignore
 => [1/4] FROM node:20-alpine
 => [2/4] WORKDIR /app
 => [3/4] COPY package*.json ./
 => [4/4] RUN npm ci --only=production
 => EXPOSE 3000
 => naming to docker.io/library/${tag}
Successfully built image ${tag}!`;

        this.images.push({
          repository: tag.split(':')[0],
          tag: tag.split(':')[1] || 'latest',
          imageId: Math.random().toString(36).substring(2, 14),
          created: 'Just now',
          size: '158MB'
        });

        return { output: buildLog, status: 'success' };
      }

      case 'exec': {
        if (args.length < 3) return { output: 'Error: "docker exec" requires container ID and command.', status: 'error' };
        const target = args[1];
        const cmd = args.slice(2).join(' ');
        return { output: `[docker exec ${target}]: ${cmd}\nCommand executed successfully inside sandbox environment.`, status: 'success' };
      }

      case 'compose': {
        const action = args[1] || 'up';
        if (action === 'up') {
          return {
            output: `[+] Running 3/3
 ✔ Network margeos_default    Created
 ✔ Container margeos-db-1     Started (PostgreSQL 15)
 ✔ Container margeos-app-1    Started (Node.js Sandbox Port 3000)
MargeOS Sandbox Compose Stack deployed successfully!`,
            status: 'success'
          };
        } else if (action === 'down') {
          return { output: `[+] Stopping MargeOS Compose Stack...\n ✔ Containers stopped and network removed.`, status: 'success' };
        }
        return { output: `Docker Compose action: ${action}`, status: 'success' };
      }

      default:
        return { output: `docker: '${sub}' is not a valid docker command. See 'docker help'.`, status: 'error' };
    }
  }

  public getRunningContainers(): VirtualContainer[] {
    return Array.from(this.containers.values());
  }
}

export default DockerRuntime.getInstance();
