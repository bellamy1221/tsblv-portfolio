import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'work'>;

function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort((first, second) => {
    const orderDifference = first.data.order - second.data.order;

    if (orderDifference !== 0) {
      return orderDifference;
    }

    return second.data.year - first.data.year;
  });
}

export async function getAllProjects(): Promise<Project[]> {
  const projects = await getCollection('work');
  return sortProjects(projects.filter((project) => !project.data.draft));
}

export async function getFeaturedProjects(): Promise<Project[]> {
  const projects = await getAllProjects();
  return projects.filter((project) => project.data.featured);
}

export async function getProjectById(id: string): Promise<Project | undefined> {
  const project = await getEntry('work', id);

  if (!project || (project.data.draft && import.meta.env.PROD)) {
    return undefined;
  }

  return project;
}

export async function getAdjacentProjects(currentId: string): Promise<{
  previous: Project | undefined;
  next: Project | undefined;
}> {
  const projects = await getAllProjects();
  const currentIndex = projects.findIndex((project) => project.id === currentId);

  if (currentIndex === -1) {
    return { previous: undefined, next: undefined };
  }

  return {
    previous: projects[currentIndex - 1],
    next: projects[currentIndex + 1],
  };
}
