import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import SpinnerOne from "../../components/ui/spinner/SpinnerOne";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { UsersAPI, type UserListItem } from "../../api/endpoints/users";
import { RolesAPI, type RoleItem } from "../../api/endpoints/roles";
import { AuthAPI } from "../../api/endpoints/auth";
import { useNotification } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";
import AvatarText from "../../components/ui/avatar/AvatarText";
import Badge from "../../components/ui/badge/Badge";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { PencilIcon, TrashBinIcon, CloseLineIcon } from "../../icons";

const TooltipWrapper = ({ title, children }: { title: string; children: React.ReactNode }) => {
  return (
    <div className="relative inline-block group">
      {children}
      <div className="invisible absolute bottom-full left-1/2 z-30 mb-2.5 -translate-x-1/2 opacity-0 transition-opacity duration-200 group-hover:visible group-hover:opacity-100">
        <div className="relative">
          <div className="whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
            {title}
          </div>
          <div className="absolute -bottom-1 left-1/2 h-3 w-4 -translate-x-1/2 rotate-45 bg-gray-900"></div>
        </div>
      </div>
    </div>
  );
};

interface UserRow {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleKey: string;
  roleLabel: string;
  country: string;
  city: string;
  original: UserListItem;
}

type UserProfile = NonNullable<UserListItem["profile"]> & Record<string, unknown>;

const getProfileString = (profile: UserProfile, key: string) => {
  const direct = (profile as Record<string, unknown>)[key];
  if (typeof direct === "string") return direct;

  const legacyKey = key.toLowerCase();
  const legacyValue = (profile as Record<string, unknown>)[legacyKey];
  return typeof legacyValue === "string" ? legacyValue : "";
};

export default function UserList() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<{ type: "soft" | "hard" | null; id: string | null }>({
    type: null,
    id: null,
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [editForm, setEditForm] = useState<{
    firstname: string;
    lastname: string;
    email: string;
    country: string;
    city: string;
    address: string;
    postal_code: string;
    roleId: string;
    roleKey: string;
    roleLabel: string;
  }>({
    firstname: "",
    lastname: "",
    email: "",
    country: "",
    city: "",
    address: "",
    postal_code: "",
    roleId: "",
    roleKey: "",
    roleLabel: "",
  });
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ mode: "soft" | "hard"; user: UserRow | null }>({
    mode: "soft",
    user: null,
  });
  const [createForm, setCreateForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    roleId: "",
  });
  const { notify } = useNotification();
  const { hasRole } = useAuth();
  const notifyRef = useRef(notify);

  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await UsersAPI.list();
        setUsers(data);
      } catch (error) {
        console.error("❌ Impossible de récupérer les utilisateurs :", error);
        notifyRef.current("error", "Erreur", "Le chargement des utilisateurs a échoué.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setRolesLoading(true);
        const data = await RolesAPI.list();
        const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
        setRoles(sorted);
      } catch (error) {
        console.error("❌ Impossible de récupérer les rôles :", error);
        notifyRef.current("error", "Erreur", "Le chargement des rôles a échoué.");
      } finally {
        setRolesLoading(false);
      }
    };

    fetchRoles();
  }, []);

const normalizeRole = (role?: string) => {
  if (!role) return "";
  const upper = role.toUpperCase();
  return upper.startsWith("ROLE_") ? upper.slice(5) : upper;
};

const formatRoleLabel = (role?: string) => {
  const normalized = normalizeRole(role);
  if (!normalized) return "";
  return normalized.charAt(0) + normalized.slice(1).toLowerCase();
};

  const roleMapById = useMemo(() => {
    const map = new Map<string, RoleItem>();
    roles.forEach((role) => {
      map.set(role.id, role);
    });
    return map;
  }, [roles]);

  const roleMapByName = useMemo(() => {
    const map = new Map<string, RoleItem>();
    roles.forEach((role) => {
      map.set(normalizeRole(role.name), role);
    });
    return map;
  }, [roles]);

  const getRoleInfoFromUser = useCallback(
    (user: UserListItem) => {
      const profile = (user.profile ?? {}) as UserProfile;

      let rawRoleName = "";

    if (typeof user.role === "string" && user.role) {
      rawRoleName = user.role;
    } else if (user.role && typeof (user.role as any).name === "string") {
      rawRoleName = (user.role as any).name;
    }

    if (!rawRoleName) {
      const rolesArray = Array.isArray((user as any)?.roles) ? (user as any).roles : [];
      for (const roleItem of rolesArray) {
        if (typeof roleItem === "string" && roleItem) {
          rawRoleName = roleItem;
          break;
        }
        if (roleItem && typeof roleItem.name === "string") {
          rawRoleName = roleItem.name;
          break;
        }
      }
    }

    if (!rawRoleName && typeof profile.role === "string" && profile.role) {
      rawRoleName = profile.role;
    }

    if (!rawRoleName && profile.role && typeof profile.role.name === "string") {
      rawRoleName = profile.role.name;
    }

    let roleId = typeof profile.role_id === "string" ? profile.role_id : "";

    if (!roleId) {
      const camelRoleId = (profile as Record<string, unknown>).roleId;
      if (typeof camelRoleId === "string") {
        roleId = camelRoleId;
      }
    }

    if (!roleId && profile.role && typeof profile.role.id === "string") {
      roleId = profile.role.id;
    }

    const normalizedRoleName = normalizeRole(rawRoleName);

    if (!roleId && normalizedRoleName) {
      const roleFromName = roleMapByName.get(normalizedRoleName);
      if (roleFromName) {
        roleId = roleFromName.id;
      }
    }

    if (!normalizedRoleName && roleId) {
      const roleFromId = roleMapById.get(roleId);
      if (roleFromId) {
        rawRoleName = roleFromId.name;
      }
    }

    const displayName = rawRoleName || roleMapById.get(roleId || "")?.name || "";
    const formattedLabel = formatRoleLabel(displayName) || formatRoleLabel(normalizedRoleName);

    return {
      roleId: roleId || "",
      roleKey: normalizeRole(displayName) || normalizedRoleName || "",
      roleLabel: formattedLabel || displayName || normalizedRoleName || "",
    };
    },
    [roleMapById, roleMapByName],
  );

  useEffect(() => {
    console.log("🔵 editingUser changed:", editingUser);
    console.log("🔵 rolesLoading:", rolesLoading);
    if (!editingUser || rolesLoading) return;

    const { roleId, roleKey, roleLabel } = getRoleInfoFromUser(editingUser);
    console.log("🔵 Updating form with role info:", { roleId, roleKey, roleLabel });
    setEditForm((prev) => ({
      ...prev,
      roleId: roleId || prev.roleId,
      roleKey: roleKey || prev.roleKey,
      roleLabel: roleLabel || prev.roleLabel,
    }));
  }, [editingUser, rolesLoading, getRoleInfoFromUser]);

  useEffect(() => {
    console.log("🟣 createOpen changed:", createOpen);
  }, [createOpen]);

  const rows = useMemo<UserRow[]>(() => {
    return users.map((user) => {
      const profile = (user.profile ?? {}) as UserProfile;
      const firstname = getProfileString(profile, "firstName");
      const lastname = getProfileString(profile, "lastName");
      const country = getProfileString(profile, "country") || "—";
      const city = getProfileString(profile, "city") || "—";
      const { roleId, roleKey, roleLabel } = getRoleInfoFromUser(user);

      return {
        id: user.id,
        name: [firstname, lastname].filter(Boolean).join(" ") || "—",
        email: user.email || "—",
        roleId,
        roleKey,
        roleLabel: roleLabel || formatRoleLabel(roleKey) || "—",
        country,
        city,
        original: user,
      };
    });
  }, [users, getRoleInfoFromUser]);

  const currentIsAdmin = hasRole("ADMIN");
  const currentIsManager = hasRole("MANAGER");
  const isAdminRole = (roleKey?: string) => normalizeRole(roleKey) === "ADMIN";

  const performSoftDelete = async (row: UserRow) => {
    setProcessing({ type: "soft", id: row.id });
    let succeeded = false;
    try {
      await UsersAPI.softDelete(row.id);
      setUsers((prev) => prev.filter((u) => u.id !== row.id));
      notify("success", "Utilisateur désactivé", "L'utilisateur a été désactivé avec succès.");
      succeeded = true;
    } catch (error) {
      console.error("❌ Soft delete échoué :", error);
      notify("error", "Erreur", "Impossible de désactiver l'utilisateur.");
    } finally {
      setProcessing({ type: null, id: null });
    }
    return succeeded;
  };

  const performHardDelete = async (row: UserRow) => {
    setProcessing({ type: "hard", id: row.id });
    let succeeded = false;
    try {
      await UsersAPI.hardDelete(row.id);
      setUsers((prev) => prev.filter((u) => u.id !== row.id));
      notify("success", "Utilisateur supprimé", "L'utilisateur a été supprimé définitivement.");
      succeeded = true;
    } catch (error) {
      console.error("❌ Hard delete échoué :", error);
      notify("error", "Erreur", "Impossible de supprimer l'utilisateur.");
    } finally {
      setProcessing({ type: null, id: null });
    }
    return succeeded;
  };

  const roleBadgeColor = (roleKey: string) => {
    const normalized = normalizeRole(roleKey);
    switch (normalized) {
      case "ADMIN":
        return "warning";
      case "MANAGER":
        return "info";
      case "COLLABORATOR":
        return "success";
      default:
        return "light";
    }
  };

  const roleOptions: { value: string; label: string }[] = useMemo(() => {
    const availableRoles = currentIsAdmin
      ? roles
      : roles.filter((role) => normalizeRole(role.name) !== "ADMIN");

    return availableRoles.map((role) => ({
      value: role.id,
      label: formatRoleLabel(role.name) || role.name,
    }));
  }, [roles, currentIsAdmin]);

  const confirmUser = confirmAction.user;
  const confirmMode = confirmAction.mode;
  const confirmLoading =
    !!confirmUser && processing.type === confirmMode && processing.id === confirmUser.id;
  const confirmDisplayName = confirmUser
    ? confirmUser.name !== "—" && confirmUser.name.trim() !== ""
      ? confirmUser.name
      : confirmUser.email
    : "";
  const confirmTitle =
    confirmMode === "soft" ? "Désactiver l'utilisateur" : "Supprimer l'utilisateur";
  const confirmDescription =
    confirmMode === "soft"
      ? "Cette action désactivera temporairement l'utilisateur. Il pourra être réactivé ultérieurement."
      : "Cette action est définitive. Toutes les données associées à cet utilisateur seront supprimées.";
  const confirmAccentBoxClass =
    confirmMode === "soft"
      ? "border-warning-100 bg-warning-50 text-warning-700 dark:border-warning-500/40 dark:bg-warning-500/10 dark:text-warning-300"
      : "border-error-100 bg-error-50 text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-300";

  const resetCreateForm = () =>
    setCreateForm({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      roleId: "",
    });

  const openCreateModal = () => {
    console.log("🟣 openCreateModal called");
    console.log("🟣 currentIsAdmin:", currentIsAdmin, "currentIsManager:", currentIsManager);
    if (!currentIsAdmin && !currentIsManager) {
      console.log("⚠️ User not authorized to create users");
      notify("warning", "Action non autorisée", "Seuls les administrateurs ou managers peuvent créer des utilisateurs.");
      return;
    }
    resetCreateForm();
    const availableRoles = currentIsAdmin
      ? roleOptions
      : roleOptions.filter((role) => normalizeRole(role.label) !== "ADMIN");
    const defaultRole = availableRoles[0]?.value ?? "";
    console.log("🟣 Available roles:", availableRoles);
    console.log("🟣 Default role selected:", defaultRole);
    setCreateForm((prev) => ({ ...prev, roleId: defaultRole }));
    setCreateOpen(true);
    console.log("🟣 Create modal should now be open");
  };

  const closeCreateModal = () => {
    if (creating) return;
    setCreateOpen(false);
    resetCreateForm();
  };

  const handleCreateFieldChange = (field: keyof typeof createForm, value: string) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateRoleChange = (roleId: string) => {
    if (!currentIsAdmin && normalizeRole(roleMapById.get(roleId)?.name) === "ADMIN") {
      notify("warning", "Action non autorisée", "Seul un administrateur peut créer un compte administrateur.");
      return;
    }
    setCreateForm((prev) => ({ ...prev, roleId }));
  };

  const resetEditForm = () =>
    setEditForm({
      firstname: "",
      lastname: "",
      email: "",
      country: "",
      city: "",
      address: "",
      postal_code: "",
      roleId: "",
      roleKey: "",
      roleLabel: "",
    });

  const openEditModal = (user: UserListItem) => {
    console.log("🔵 openEditModal called with user:", user);
    const profile = (user.profile ?? {}) as UserProfile;
    const { roleId, roleKey, roleLabel } = getRoleInfoFromUser(user);

    const formData = {
      firstname: getProfileString(profile, "firstName"),
      lastname: getProfileString(profile, "lastName"),
      email: user.email || "",
      country: getProfileString(profile, "country"),
      city: getProfileString(profile, "city"),
      address: getProfileString(profile, "address"),
      postal_code: getProfileString(profile, "postal_code"),
      roleId: roleId || "",
      roleKey: roleKey || normalizeRole(roleLabel) || "",
      roleLabel: roleLabel || formatRoleLabel(roleKey) || "",
    };
    console.log("🔵 Setting edit form data:", formData);
    setEditForm(formData);
    setEditingUser(user);
    console.log("🔵 editingUser state should now be set");
  };

  const closeEditModal = () => {
    setEditingUser(null);
    resetEditForm();
  };

  const handleEditFormChange = (field: keyof typeof editForm, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRoleChange = (value: string) => {
    if (!value) {
      setEditForm((prev) => ({ ...prev, roleId: "", roleKey: "", roleLabel: "" }));
      return;
    }

    const selectedRole = roleMapById.get(value) || roles.find((role) => role.id === value);
    setEditForm((prev) => ({
      ...prev,
      roleId: value,
      roleKey: selectedRole ? normalizeRole(selectedRole.name) : prev.roleKey,
      roleLabel: selectedRole ? formatRoleLabel(selectedRole.name) || selectedRole.name : prev.roleLabel,
    }));
  };

  const closeConfirmAction = () => setConfirmAction({ mode: "soft", user: null });

  const requestSoftDelete = (row: UserRow) => {
    if (processing.type) return;
    if (!currentIsAdmin && !(currentIsManager && !isAdminRole(row.roleKey))) {
      notify("warning", "Action non autorisée", "Vous ne pouvez pas désactiver cet utilisateur.");
      return;
    }
    setConfirmAction({ mode: "soft", user: row });
  };

  const requestHardDelete = (row: UserRow) => {
    if (processing.type) return;
    if (!currentIsAdmin) {
      notify("warning", "Action non autorisée", "Seul un administrateur peut supprimer définitivement un compte.");
      return;
    }
    setConfirmAction({ mode: "hard", user: row });
  };

  const handleConfirmDelete = async () => {
    if (!confirmAction.user) return;
    const row = confirmAction.user;

    const success =
      confirmAction.mode === "soft" ? await performSoftDelete(row) : await performHardDelete(row);

    if (success) {
      closeConfirmAction();
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    console.log("🟢 handleUpdateUser called");
    e.preventDefault();
    if (!editingUser) {
      console.log("❌ No editingUser found, returning early");
      return;
    }
    console.log("🟢 editingUser:", editingUser);

    if (rolesLoading) {
      console.log("⚠️ Roles are still loading");
      notify("info", "Chargement des rôles", "Veuillez patienter pendant la récupération des rôles.");
      return;
    }

    if (!editForm.roleId) {
      console.log("⚠️ No roleId in form");
      notify("warning", "Champ manquant", "Veuillez sélectionner un rôle.");
      return;
    }

    const normalizedSelectedRole = normalizeRole(editForm.roleKey);

    if (!currentIsAdmin && normalizedSelectedRole === "ADMIN") {
      console.log("⚠️ Non-admin trying to set ADMIN role");
      notify("warning", "Action non autorisée", "Seul un administrateur peut attribuer le rôle ADMIN.");
      return;
    }

    const roleId = editForm.roleId;
    const selectedRole = roleMapById.get(roleId || "") || roles.find((role) => role.id === roleId);
    const selectedRoleName = selectedRole?.name || editForm.roleLabel || editForm.roleKey || normalizedSelectedRole;

    const profilePayload: Record<string, string> = {
      firstName: editForm.firstname.trim(),
      lastName: editForm.lastname.trim(),
      country: editForm.country.trim(),
      city: editForm.city.trim(),
      address: editForm.address.trim(),
      postal_code: editForm.postal_code.trim(),
      role_id: roleId,
    };

    const payload = {
      role_id: roleId,
      profile: profilePayload,
    };

    console.log("🟢 Sending payload to API:", payload);

    try {
      setUpdating(true);
      console.log("🟢 Calling UsersAPI.update...");
      const res = await UsersAPI.update(editingUser.id, payload);
      console.log("🟢 API response:", res);
      const updatedUser: UserListItem = {
        ...editingUser,
        ...(res || {}),
        role: res?.role ?? res?.profile?.role?.name ?? selectedRoleName ?? editingUser.role,
        profile: {
          ...(editingUser.profile ?? {}),
          ...(res?.profile ?? payload.profile),
          role_id: res?.profile?.role_id ?? roleId,
          role:
            res?.profile?.role ??
            selectedRole ??
            (roleId
              ? {
                  id: roleId,
                  name: selectedRoleName,
                }
              : undefined),
        },
      };
      console.log("🟢 Updated user object:", updatedUser);
      setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? updatedUser : u)));
      notify("success", "Utilisateur mis à jour", "Les modifications ont été enregistrées.");
      closeEditModal();
    } catch (error) {
      console.error("❌ Mise à jour utilisateur échouée :", error);
      notify("error", "Erreur", "Impossible de mettre à jour l'utilisateur.");
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    console.log("🟣 handleCreateUser called");
    e.preventDefault();
    console.log("🟣 createForm:", createForm);

    if (rolesLoading) {
      console.log("⚠️ Roles are still loading");
      notify("info", "Chargement des rôles", "Veuillez patienter pendant la récupération des rôles.");
      return;
    }

    if (!createForm.firstName.trim() || !createForm.lastName.trim()) {
      console.log("⚠️ Missing firstName or lastName");
      notify("warning", "Champs manquants", "Prénom et nom sont obligatoires.");
      return;
    }

    if (!createForm.email.trim()) {
      console.log("⚠️ Missing email");
      notify("warning", "Champs manquants", "L'email est obligatoire.");
      return;
    }

    if (!createForm.password.trim()) {
      console.log("⚠️ Missing password");
      notify("warning", "Champs manquants", "Le mot de passe est obligatoire.");
      return;
    }

    if (!createForm.roleId) {
      console.log("⚠️ Missing roleId");
      notify("warning", "Champs manquants", "Veuillez sélectionner un rôle.");
      return;
    }

    if (!currentIsAdmin && normalizeRole(roleMapById.get(createForm.roleId)?.name) === "ADMIN") {
      console.log("⚠️ Non-admin trying to create ADMIN user");
      notify("warning", "Action non autorisée", "Seul un administrateur peut créer un compte administrateur.");
      return;
    }

    const role = roleMapById.get(createForm.roleId);
    if (!role) {
      console.log("❌ Role not found in roleMapById");
      notify("error", "Rôle introuvable", "Impossible de déterminer le rôle sélectionné.");
      return;
    }

    const payload = {
      email: createForm.email.trim(),
      password: createForm.password.trim(),
      roleName: normalizeRole(role.name) || role.name,
      firstName: createForm.firstName.trim(),
      lastName: createForm.lastName.trim(),
    };

    console.log("🟣 Sending payload to API:", payload);

    try {
      setCreating(true);
      console.log("🟣 Calling AuthAPI.register...");
      const res = await AuthAPI.register(payload as any);
      console.log("🟣 API response:", res);
      const newUser: UserListItem = res?.data ?? res;
      console.log("🟣 New user object:", newUser);
      setUsers((prev) => [newUser, ...prev]);
      notify("success", "Utilisateur créé", "Le nouvel utilisateur a été ajouté avec succès.");
      closeCreateModal();
    } catch (error) {
      console.error("❌ Création utilisateur échouée :", error);
      notify("error", "Erreur", "Impossible d'ajouter l'utilisateur.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <PageMeta title="Liste des utilisateurs | Allure Création" description="Consultez l'ensemble des utilisateurs enregistrés sur Allure Création." />
      <PageBreadcrumb pageTitle="Liste des utilisateurs" />
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Utilisateurs</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {loading ? "Chargement..." : `${rows.length} utilisateur${rows.length > 1 ? "s" : ""}`}
            </p>
          </div>
          {(currentIsAdmin || currentIsManager) && (
            <Button
              onClick={() => {
                console.log("🟣 'Ajouter un utilisateur' button clicked");
                openCreateModal();
              }}
              disabled={rolesLoading}
              variant="outline"
            >
              Ajouter un utilisateur
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex w-full justify-center py-16">
            <SpinnerOne />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex w-full flex-col items-center justify-center gap-2 py-16 text-center">
            <h4 className="text-base font-medium text-gray-800 dark:text-white/90">Aucun utilisateur trouvé</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Dès qu’un utilisateur sera créé, il apparaîtra automatiquement ici.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <TableHeader className="bg-gray-50 dark:bg-white/[0.03]">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    Utilisateur
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    Rôle
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    Ville
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    Pays
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-transparent">
                {rows.map((row) => {
                  const targetIsAdmin = isAdminRole(row.roleKey);
                  const canEditRow = currentIsAdmin || (currentIsManager && !targetIsAdmin);
                  const canSoftDeleteRow = currentIsAdmin || (currentIsManager && !targetIsAdmin);
                  const showHardDelete = currentIsAdmin;
                  const softDisabled =
                    !canSoftDeleteRow || (processing.type === "soft" && processing.id === row.id);
                  const hardDisabled =
                    !showHardDelete || (processing.type === "hard" && processing.id === row.id);
                  return (
                    <TableRow key={row.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.05]">
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <AvatarText name={row.name || row.email} />
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">{row.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{row.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {row.roleKey ? (
                          <Badge variant="light" color={roleBadgeColor(row.roleKey)} size="sm">
                            {row.roleLabel || formatRoleLabel(row.roleKey) || row.roleKey}
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {row.city}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {row.country}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <TooltipWrapper title="Modifier">
                            <button
                              type="button"
                              onClick={() => {
                                console.log("🔵 Edit button clicked for user:", row.original);
                                console.log("🔵 canEditRow:", canEditRow);
                                openEditModal(row.original);
                              }}
                              disabled={!canEditRow}
                              className={`inline-flex size-9 items-center justify-center rounded-lg border transition ${
                                canEditRow
                                  ? "border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/10"
                                  : "cursor-not-allowed border-gray-200 text-gray-400 dark:border-gray-700 dark:text-gray-500"
                              }`}
                            >
                              <PencilIcon className="size-4" />
                            </button>
                          </TooltipWrapper>
                          {canSoftDeleteRow && (
                            <TooltipWrapper title="Désactiver">
                              <button
                                type="button"
                                onClick={() => !softDisabled && requestSoftDelete(row)}
                                disabled={softDisabled}
                                className={`inline-flex size-9 items-center justify-center rounded-lg border transition ${
                                  softDisabled
                                    ? "cursor-not-allowed border-gray-200 text-gray-400 opacity-60 dark:border-gray-700 dark:text-gray-500"
                                    : "border-gray-300 text-warning-600 hover:bg-gray-50 hover:text-warning-600 dark:border-gray-700 dark:text-warning-400 dark:hover:bg-white/10"
                                }`}
                              >
                                <CloseLineIcon className="size-4" />
                              </button>
                            </TooltipWrapper>
                          )}
                          {showHardDelete && (
                            <TooltipWrapper title="Supprimer définitivement">
                              <button
                                type="button"
                                onClick={() => !hardDisabled && requestHardDelete(row)}
                                disabled={hardDisabled}
                                className={`inline-flex size-9 items-center justify-center rounded-lg border transition ${
                                  hardDisabled
                                    ? "cursor-not-allowed border-gray-200 text-gray-400 opacity-60 dark:border-gray-700 dark:text-gray-500"
                                    : "border-gray-300 text-error-600 hover:bg-gray-50 hover:text-error-600 dark:border-gray-700 dark:text-error-400 dark:hover:bg-white/10"
                                }`}
                              >
                                <TrashBinIcon className="size-4" />
                              </button>
                            </TooltipWrapper>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      <Modal
        isOpen={Boolean(confirmUser)}
        onClose={confirmLoading ? () => undefined : closeConfirmAction}
        showCloseButton={false}
        className="max-w-md w-full p-6"
      >
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {confirmTitle}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{confirmDescription}</p>
          </div>

          {confirmUser && (
            <div className={`rounded-xl border px-4 py-3 text-sm ${confirmAccentBoxClass}`}>
              <p>
                Utilisateur :
                <span className="font-semibold"> {confirmDisplayName}</span>
              </p>
              {confirmUser.email && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{confirmUser.email}</p>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeConfirmAction}
              disabled={confirmLoading}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-sm ring-1 ring-inset transition ${
                confirmLoading
                  ? "cursor-not-allowed opacity-60 ring-gray-200 text-gray-400 dark:ring-gray-700 dark:text-gray-500"
                  : "ring-gray-300 text-gray-700 hover:bg-gray-50 dark:ring-gray-700 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200"
              }`}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={confirmLoading}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-sm text-white shadow-theme-xs transition focus:outline-hidden focus:ring-3 ${
                confirmLoading
                  ? "cursor-not-allowed opacity-60 bg-gray-300 dark:bg-gray-700"
                  : confirmMode === "soft"
                  ? "bg-warning-600 hover:bg-warning-700 focus:ring-warning-500/20"
                  : "bg-error-600 hover:bg-error-700 focus:ring-error-500/20"
              }`}
            >
              {confirmLoading
                ? "Traitement..."
                : confirmMode === "soft"
                ? "Oui, désactiver"
                : "Oui, supprimer"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={createOpen}
        onClose={creating ? () => undefined : closeCreateModal}
        className="max-w-[500px] w-full p-6"
      >
        <form className="flex flex-col gap-6" onSubmit={handleCreateUser}>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Nouvel utilisateur
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Renseignez les informations pour créer un nouveau compte.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Prénom
              </label>
              <Input
                value={createForm.firstName}
                onChange={(e) => handleCreateFieldChange("firstName", e.target.value)}
                placeholder="Prénom"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nom
              </label>
              <Input
                value={createForm.lastName}
                onChange={(e) => handleCreateFieldChange("lastName", e.target.value)}
                placeholder="Nom"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <Input
                type="email"
                value={createForm.email}
                onChange={(e) => handleCreateFieldChange("email", e.target.value)}
                placeholder="email@exemple.com"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Mot de passe
              </label>
              <Input
                type="password"
                value={createForm.password}
                onChange={(e) => handleCreateFieldChange("password", e.target.value)}
                placeholder="Mot de passe sécurisé"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Rôle
              </label>
              <Select
                key={`create-role-${createForm.roleId}`}
                options={roleOptions}
                defaultValue={createForm.roleId}
                onChange={handleCreateRoleChange}
                placeholder="Sélectionner un rôle"
                disabled={rolesLoading || roleOptions.length === 0 || creating}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeCreateModal}
              disabled={creating}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-sm ring-1 ring-inset transition ${
                creating
                  ? "cursor-not-allowed opacity-60 ring-gray-200 text-gray-400 dark:ring-gray-700 dark:text-gray-500"
                  : "ring-gray-300 text-gray-700 hover:bg-gray-50 dark:ring-gray-700 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200"
              }`}
            >
              Annuler
            </button>
            <Button type="submit" disabled={creating || rolesLoading || !createForm.roleId}>
              {creating ? "Création..." : "Créer"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(editingUser)}
        showCloseButton={false}
        onClose={updating ? () => undefined : closeEditModal}
        className="max-w-[520px] w-full p-6"
      >
        <form className="flex flex-col gap-6" onSubmit={handleUpdateUser}>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Modifier l'utilisateur
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Ajustez les informations de l'utilisateur sélectionné.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Prénom
              </label>
              <Input
                value={editForm.firstname}
                onChange={(e) => handleEditFormChange("firstname", e.target.value)}
                placeholder="Prénom"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nom
              </label>
              <Input
                value={editForm.lastname}
                onChange={(e) => handleEditFormChange("lastname", e.target.value)}
                placeholder="Nom"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <Input value={editForm.email} disabled />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Ville
              </label>
              <Input
                value={editForm.city}
                onChange={(e) => handleEditFormChange("city", e.target.value)}
                placeholder="Ville"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Pays
              </label>
              <Input
                value={editForm.country}
                onChange={(e) => handleEditFormChange("country", e.target.value)}
                placeholder="Pays"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Adresse
              </label>
              <Input
                value={editForm.address}
                onChange={(e) => handleEditFormChange("address", e.target.value)}
                placeholder="Adresse"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Code postal
              </label>
              <Input
                value={editForm.postal_code}
                onChange={(e) => handleEditFormChange("postal_code", e.target.value)}
                placeholder="Code postal"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Rôle
              </label>
              <Select
                key={editingUser?.id ?? "role-select"}
                options={roleOptions}
                defaultValue={editForm.roleId}
                placeholder="Sélectionner un rôle"
                onChange={handleRoleChange}
                disabled={rolesLoading || roleOptions.length === 0}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeEditModal}
              disabled={updating}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-sm ring-1 ring-inset transition ${
                updating
                  ? "cursor-not-allowed opacity-60 ring-gray-200 text-gray-400 dark:ring-gray-700 dark:text-gray-500"
                  : "ring-gray-300 text-gray-700 hover:bg-gray-50 dark:ring-gray-700 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200"
              }`}
            >
              Annuler
            </button>
            <Button type="submit" disabled={updating || !editForm.roleId || rolesLoading || roleOptions.length === 0}>
              {updating ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
