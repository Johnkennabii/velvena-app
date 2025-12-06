import { useEffect, useState } from "react";
import { EmailsAPI, EmailFolder } from "../../../api/endpoints/emails";
import { useAuth } from "../../../context/AuthContext";
import EmailFolderDrawer from "./EmailFolderDrawer";

interface FolderListProps {
  onFolderSelect: (folder: string) => void;
  selectedFolder: string;
}

interface FolderNode extends EmailFolder {
  children: FolderNode[];
  level: number;
  parent?: string;
}

export default function FolderList({ onFolderSelect, selectedFolder }: FolderListProps) {
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  const fetchFolders = async () => {
    try {
      const data = await EmailsAPI.getFolders();

      // Filtrer les dossiers sous INBOX uniquement, et exclure Administrator si non admin
      const subFolders = data.filter((folder) => {
        // Garder uniquement les sous-dossiers de INBOX
        if (!folder.name.includes("/")) return false;

        // Filtrer Administrator si l'utilisateur n'est pas admin
        if (folder.name.includes("/Administrator") && user?.role !== "ADMIN") {
          return false;
        }

        return true;
      });

      // Construire la hiérarchie
      const folderTree = buildFolderTree(subFolders);
      setFolders(folderTree);
    } catch (error) {
      console.error("Erreur lors de la récupération des dossiers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, [user?.role]);

  // Construire l'arbre de dossiers
  const buildFolderTree = (folders: EmailFolder[]): FolderNode[] => {
    const tree: FolderNode[] = [];
    const folderMap = new Map<string, FolderNode>();

    // Trier par nom pour avoir un ordre cohérent
    const sortedFolders = [...folders].sort((a, b) => a.name.localeCompare(b.name));

    sortedFolders.forEach((folder) => {
      const parts = folder.name.split("/");
      const level = parts.length - 1;
      const parent = parts.slice(0, -1).join("/");

      const node: FolderNode = {
        ...folder,
        children: [],
        level,
        parent: parent || undefined,
      };

      folderMap.set(folder.name, node);

      if (parent) {
        const parentNode = folderMap.get(parent);
        if (parentNode) {
          parentNode.children.push(node);
        } else {
          tree.push(node);
        }
      } else {
        tree.push(node);
      }
    });

    return tree;
  };

  const toggleFolder = (folderName: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderName)) {
        next.delete(folderName);
      } else {
        next.add(folderName);
      }
      return next;
    });
  };

  const handleFolderCreated = async () => {
    // Rafraîchir la liste après création
    await fetchFolders();
  };

  const renderFolder = (folder: FolderNode): React.ReactElement => {
    const hasChildren = folder.children.length > 0;
    const isExpanded = expandedFolders.has(folder.name);
    const isActive = selectedFolder === folder.name.toLowerCase();
    const displayName = folder.name.split("/").pop() || folder.name;

    return (
      <li key={folder.name}>
        <div className="flex items-center">
          {hasChildren && (
            <button
              onClick={() => toggleFolder(folder.name)}
              className="flex h-6 w-6 items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
              >
                <path
                  d="M7.5 5L12.5 10L7.5 15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}

          <button
            onClick={() => onFolderSelect(folder.name.toLowerCase())}
            className={`flex-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              hasChildren ? "" : "ml-6"
            } ${
              isActive
                ? "text-brand-500 bg-brand-50 dark:text-brand-400 dark:bg-brand-500/[0.12]"
                : "text-gray-500 dark:text-gray-400 hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-brand-500/[0.12] dark:hover:text-brand-400"
            }`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M2.5 5.83333C2.5 4.45262 3.61929 3.33333 5 3.33333H6.91667C7.32388 3.33333 7.70081 3.55952 7.89624 3.92262L8.76043 5.41667H15C16.3807 5.41667 17.5 6.53595 17.5 7.91667V14.1667C17.5 15.5474 16.3807 16.6667 15 16.6667H5C3.61929 16.6667 2.5 15.5474 2.5 14.1667V5.83333Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {displayName}
          </button>
        </div>

        {hasChildren && isExpanded && (
          <ul className="ml-4 mt-1 space-y-1">
            {folder.children.map((child) => renderFolder(child))}
          </ul>
        )}
      </li>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium uppercase leading-[18px] text-gray-700 dark:text-gray-400">
          DOSSIERS
        </h3>
        <button
          onClick={() => setShowDrawer(true)}
          className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-brand-500/[0.12] dark:hover:text-brand-400 transition-colors"
          title="Créer un dossier"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 4.16667V15.8333M4.16667 10H15.8333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {folders.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">
          Aucun dossier
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {folders.map((folder) => renderFolder(folder))}
        </ul>
      )}

      {/* Drawer de création de dossier */}
      <EmailFolderDrawer
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        onFolderCreated={handleFolderCreated}
      />
    </div>
  );
}
