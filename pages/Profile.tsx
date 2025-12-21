import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeResume } from '../services/geminiService';
import { useUser } from '../context/UserContext';
import { Skill, WorkExperience, Project, Education, Certification } from '../types';
import { DEFAULT_AVATAR } from '../utils/constants';

type ModalType = 'BASIC_INFO' | 'EXPERIENCE' | 'PROJECT' | 'EDUCATION' | 'CERTIFICATION' | 'SKILLS' | null;

const Profile: React.FC = () => {
  const { user, updateUser } = useUser();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null); // For Resume/CV
  const avatarInputRef = useRef<HTMLInputElement>(null); // For Profile Picture
  const navigate = useNavigate();

  // Modal State
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [editingItem, setEditingItem] = useState<any>(null); // Holds the object being edited or null for new

  // --- Resume Upload Handler ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      const mimeType = file.type;
      
      const result = await analyzeResume({ data: base64String, mimeType });
      if (result && result.name) {
          await updateUser(result);
          alert("Resume analyzed and profile updated successfully!");
      } else {
          alert("Could not extract data from resume. Please try a clearer PDF or different format.");
      }
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  // --- Avatar Upload Handler ---
  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert("Please upload a valid image file (JPEG, PNG, WebP).");
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB.");
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
        const base64String = reader.result as string;
        updateUser({ avatarUrl: base64String });
    };
    reader.readAsDataURL(file);
  };

  // --- CRUD Handlers ---

  const handleSaveBasicInfo = (formData: any) => {
    updateUser({
        name: formData.name,
        role: formData.role,
        location: formData.location,
        bio: formData.bio,
        targetRole: formData.targetRole
    });
    closeModal();
  };

  const handleSaveExperience = (formData: WorkExperience) => {
    const newItem = { ...formData, id: formData.id || Date.now().toString() };
    const newList = editingItem 
        ? user.experience.map(item => item.id === newItem.id ? newItem : item)
        : [newItem, ...user.experience]; // Add to top
    updateUser({ experience: newList });
    closeModal();
  };

  const handleDeleteExperience = (id: string) => {
    if(window.confirm("Delete this experience entry?")) {
        updateUser({ experience: user.experience.filter(e => e.id !== id) });
    }
  };

  const handleSaveProject = (formData: Project) => {
      const newItem = { 
          ...formData, 
          id: formData.id || Date.now().toString(),
          techStack: typeof formData.techStack === 'string' ? (formData.techStack as string).split(',').map((s: string) => s.trim()) : formData.techStack
      };
      const newList = editingItem 
        ? user.projects.map(item => item.id === newItem.id ? newItem : item)
        : [newItem, ...user.projects];
      updateUser({ projects: newList });
      closeModal();
  };

  const handleDeleteProject = (id: string) => {
      if(window.confirm("Delete this project?")) {
          updateUser({ projects: user.projects.filter(p => p.id !== id) });
      }
  };

  const handleSaveEducation = (formData: Education) => {
      const newItem = { ...formData, id: formData.id || Date.now().toString() };
      const newList = editingItem 
        ? user.education.map(item => item.id === newItem.id ? newItem : item)
        : [...user.education, newItem];
      updateUser({ education: newList });
      closeModal();
  };

  const handleDeleteEducation = (id: string) => {
    if(window.confirm("Delete this education entry?")) {
        updateUser({ education: user.education.filter(e => e.id !== id) });
    }
  };

  const handleSaveCertification = (formData: Certification) => {
    const newItem = { ...formData, id: formData.id || Date.now().toString() };
    const newList = editingItem 
      ? user.certifications.map(item => item.id === newItem.id ? newItem : item)
      : [...user.certifications, newItem];
    updateUser({ certifications: newList });
    closeModal();
  };

  const handleDeleteCertification = (id: string) => {
      if(window.confirm("Delete this certification?")) {
          updateUser({ certifications: user.certifications.filter(c => c.id !== id) });
      }
  };

  const handleAddSkill = (skillName: string, category: Skill['category']) => {
      if (!skillName) return;
      const newSkill: Skill = { name: skillName, category, level: 'Intermediate', verified: false };
      updateUser({ skills: [...user.skills, newSkill] });
  };

  const handleRemoveSkill = (skillName: string) => {
      updateUser({ skills: user.skills.filter(s => s.name !== skillName) });
  };

  // --- Modal Helpers ---

  const openModal = (type: ModalType, item: any = null) => {
      setActiveModal(type);
      setEditingItem(item);
  };

  const closeModal = () => {
      setActiveModal(null);
      setEditingItem(null);
  };

  const getSkillColor = (category: Skill['category']) => {
    switch (category) {
      case 'Technical': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Tools': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Domain': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Soft': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // --- Render Modals ---
  const renderModal = () => {
      if (!activeModal) return null;

      const ModalContainer = ({ title, children, onSave }: any) => (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                      <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                      <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                          <span className="material-symbols-outlined text-gray-500">close</span>
                      </button>
                  </div>
                  <div className="p-6 flex-1 overflow-y-auto">
                    {children}
                  </div>
                  <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 sticky bottom-0 z-10">
                      <button onClick={closeModal} className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                      <button onClick={onSave} className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark shadow-md transition-colors">Save Changes</button>
                  </div>
              </div>
          </div>
      );

      const inputClasses = "w-full p-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none";

      // 1. Basic Info Modal
      if (activeModal === 'BASIC_INFO') {
          const formData = editingItem || { name: user.name, role: user.role, location: user.location, bio: user.bio, targetRole: user.targetRole };
          const handleChange = (e: any) => setEditingItem({ ...formData, [e.target.name]: e.target.value });
          
          return (
              <ModalContainer title="Edit Profile Details" onSave={() => handleSaveBasicInfo(formData)}>
                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                              <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClasses} />
                          </div>
                          <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">Current Role</label>
                              <input type="text" name="role" value={formData.role} onChange={handleChange} className={inputClasses} />
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Target Role</label>
                          <input type="text" name="targetRole" value={formData.targetRole} onChange={handleChange} className={inputClasses} />
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Location</label>
                          <input type="text" name="location" value={formData.location} onChange={handleChange} className={inputClasses} />
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">About Me (Bio)</label>
                          <textarea name="bio" value={formData.bio} onChange={handleChange} rows={5} className={`${inputClasses} resize-none`}></textarea>
                      </div>
                  </div>
              </ModalContainer>
          );
      }

      // 2. Experience Modal
      if (activeModal === 'EXPERIENCE') {
          const formData = editingItem || { company: '', role: '', startDate: '', endDate: 'Present', description: '', type: 'Full-time' };
          const handleChange = (e: any) => setEditingItem({ ...formData, [e.target.name]: e.target.value });

          return (
              <ModalContainer title={editingItem?.id ? "Edit Experience" : "Add Experience"} onSave={() => handleSaveExperience(formData)}>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Company</label>
                          <input type="text" name="company" value={formData.company} onChange={handleChange} className={inputClasses} />
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Role Title</label>
                          <input type="text" name="role" value={formData.role} onChange={handleChange} className={inputClasses} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date (Year)</label>
                              <input type="text" name="startDate" value={formData.startDate} onChange={handleChange} placeholder="e.g. 2021" className={inputClasses} />
                          </div>
                          <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">End Date</label>
                              <input type="text" name="endDate" value={formData.endDate} onChange={handleChange} placeholder="e.g. Present or 2023" className={inputClasses} />
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                          <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className={`${inputClasses} resize-none`}></textarea>
                      </div>
                  </div>
              </ModalContainer>
          );
      }

      // 3. Project Modal
      if (activeModal === 'PROJECT') {
          // Flatten techStack array to string for input
          const initialData = editingItem ? {
              ...editingItem,
              techStack: Array.isArray(editingItem.techStack) ? editingItem.techStack.join(', ') : editingItem.techStack
          } : { name: '', description: '', techStack: '', type: 'Personal', image: '' };
          
          const formData = editingItem && !editingItem.techStack ? initialData : editingItem || initialData;
          
          const handleChange = (e: any) => setEditingItem({ ...formData, [e.target.name]: e.target.value });

          return (
             <ModalContainer title={initialData.id ? "Edit Project" : "Add Project"} onSave={() => handleSaveProject(formData)}>
                 <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Project Name</label>
                          <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClasses} />
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Tech Stack (comma separated)</label>
                          <input type="text" name="techStack" value={formData.techStack} onChange={handleChange} placeholder="React, Node.js, MongoDB" className={inputClasses} />
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                          <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className={`${inputClasses} resize-none`}></textarea>
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Image URL (Optional)</label>
                          <input type="text" name="image" value={formData.image} onChange={handleChange} placeholder="https://..." className={inputClasses} />
                      </div>
                  </div>
             </ModalContainer>
          );
      }

      // 4. Education Modal
      if (activeModal === 'EDUCATION') {
          const formData = editingItem || { institution: '', degree: '', year: '' };
          const handleChange = (e: any) => setEditingItem({ ...formData, [e.target.name]: e.target.value });

          return (
              <ModalContainer title={editingItem?.id ? "Edit Education" : "Add Education"} onSave={() => handleSaveEducation(formData)}>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Institution / University</label>
                          <input type="text" name="institution" value={formData.institution} onChange={handleChange} className={inputClasses} />
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Degree</label>
                          <input type="text" name="degree" value={formData.degree} onChange={handleChange} className={inputClasses} />
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Years Attended</label>
                          <input type="text" name="year" value={formData.year} onChange={handleChange} placeholder="2018 - 2022" className={inputClasses} />
                      </div>
                  </div>
              </ModalContainer>
          );
      }
      
      // 5. Certification Modal
      if (activeModal === 'CERTIFICATION') {
          const formData = editingItem || { name: '', issuer: '', date: '' };
          const handleChange = (e: any) => setEditingItem({ ...formData, [e.target.name]: e.target.value });

          return (
              <ModalContainer title={editingItem?.id ? "Edit Certification" : "Add Certification"} onSave={() => handleSaveCertification(formData)}>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Certification Name</label>
                          <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClasses} />
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Issuer (e.g. Google, AWS)</label>
                          <input type="text" name="issuer" value={formData.issuer} onChange={handleChange} className={inputClasses} />
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Date Issued</label>
                          <input type="text" name="date" value={formData.date} onChange={handleChange} placeholder="Jan 2023" className={inputClasses} />
                      </div>
                  </div>
              </ModalContainer>
          );
      }

      // 6. Skills Modal
      if (activeModal === 'SKILLS') {
        const [newSkill, setNewSkill] = useState('');
        const [category, setCategory] = useState<Skill['category']>('Technical');

        return (
            <ModalContainer title="Manage Skills" onSave={closeModal}>
                <div className="space-y-6">
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Add New Skill</label>
                            <input 
                                type="text" 
                                value={newSkill} 
                                onChange={(e) => setNewSkill(e.target.value)} 
                                placeholder="e.g. TypeScript"
                                className={inputClasses}
                            />
                        </div>
                        <div className="w-1/3">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                            <select 
                                value={category}
                                onChange={(e) => setCategory(e.target.value as any)}
                                className={inputClasses}
                            >
                                <option value="Technical">Technical</option>
                                <option value="Tools">Tools</option>
                                <option value="Domain">Domain</option>
                                <option value="Soft">Soft Skills</option>
                            </select>
                        </div>
                        <button 
                            onClick={() => { handleAddSkill(newSkill, category); setNewSkill(''); }}
                            className="p-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark"
                        >
                            Add
                        </button>
                    </div>
                    
                    <div>
                        <h4 className="font-bold text-gray-900 mb-3">Current Skills</h4>
                        <div className="flex flex-wrap gap-2">
                            {user.skills.map((skill) => (
                                <div key={skill.name} className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-2 ${getSkillColor(skill.category)}`}>
                                    {skill.name}
                                    <button onClick={() => handleRemoveSkill(skill.name)} className="hover:text-red-600 rounded-full">
                                        <span className="material-symbols-outlined text-xs font-bold">close</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </ModalContainer>
        );
    }
      return null;
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {renderModal()}
      
      {/* 1. Profile Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
              <img 
                src={user.avatarUrl || DEFAULT_AVATAR} 
                alt={user.name} 
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md bg-gray-200 group-hover:opacity-75 transition-opacity" 
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-full">
                   <span className="material-symbols-outlined text-white drop-shadow-md">upload</span>
              </div>
              <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-white ${user.openToOpportunities ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                <span className="material-symbols-outlined text-blue-500 text-xl" title="Verified Profile">verified</span>
              </div>
              <p className="text-gray-600 font-medium">{user.role} <span className="text-gray-400">@</span> {user.experience[0]?.company || 'Current Company'}</p>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">location_on</span> {user.location}</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">work</span> {user.openToOpportunities ? 'Open to opportunities' : 'Not looking'}</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span> Joined {user.joinedDate}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button 
                onClick={() => openModal('BASIC_INFO')}
                className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">edit</span> Edit Profile
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md"
            >
              {loading ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : <span className="material-symbols-outlined text-sm">upload_file</span>}
              {loading ? 'Analyzing...' : 'Upload Resume'}
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx" onChange={handleFileUpload} />
            <input type="file" ref={avatarInputRef} className="hidden" accept="image/png, image/jpeg, image/jpg, image/webp" onChange={handleAvatarUpload} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* About Me */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">About Me</h2>
              <button 
                onClick={() => openModal('BASIC_INFO')}
                className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
              >
                  <span className="material-symbols-outlined text-sm">edit</span> Edit
              </button>
            </div>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{user.bio || "Add a bio to tell your story."}</p>
          </div>

          {/* Work Experience */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
             <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Work Experience</h2>
              <button 
                onClick={() => openModal('EXPERIENCE')}
                className="flex items-center gap-1 text-sm text-primary font-medium hover:underline"
              >
                <span className="material-symbols-outlined text-sm">add</span> Add New
              </button>
            </div>
            
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:ml-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
               {user.experience.map((exp) => (
                  <div key={exp.id} className="relative flex items-start group">
                     {/* Timeline Dot */}
                     <div className="absolute left-6 md:left-0 ml-[-5px] mt-1.5 h-3 w-3 rounded-full border border-white bg-slate-300 shadow group-hover:bg-primary transition-colors"></div>
                     
                     <div className="ml-12 w-full">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 group-hover:bg-gray-50/50 p-2 -ml-2 rounded-lg transition-colors">
                           <div>
                              <h3 className="text-base font-bold text-gray-900">{exp.role}</h3>
                              <p className="text-sm text-gray-600 font-medium">{exp.company} • <span className="text-gray-500 font-normal">{exp.type || 'Full-time'}</span></p>
                           </div>
                           <div className="flex flex-col sm:items-end gap-1">
                               <span className="text-sm text-gray-400 font-medium mt-1 sm:mt-0">{exp.startDate} - {exp.endDate}</span>
                               <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button onClick={() => openModal('EXPERIENCE', exp)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><span className="material-symbols-outlined text-base">edit</span></button>
                                   <button onClick={() => handleDeleteExperience(exp.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><span className="material-symbols-outlined text-base">delete</span></button>
                               </div>
                           </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">{exp.description}</p>
                        {/* Experience Skills (Optional) */}
                        {exp.skillsUsed && exp.skillsUsed.length > 0 && (
                           <div className="flex flex-wrap gap-2 mt-2">
                              {exp.skillsUsed.map(skill => (
                                 <span key={skill} className="text-xs px-2 py-0.5 bg-gray-50 text-gray-500 rounded border border-gray-100">{skill}</span>
                              ))}
                           </div>
                        )}
                     </div>
                  </div>
               ))}
            </div>
          </div>

          {/* Featured Projects */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
             <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Featured Projects</h2>
              <button onClick={() => openModal('PROJECT')} className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">add</span> Add Project
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.projects.map((project) => (
                    <div key={project.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group relative">
                         {/* Edit/Delete Overlay */}
                         <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button onClick={() => openModal('PROJECT', project)} className="bg-white/90 p-1.5 rounded-full shadow-sm hover:text-blue-600 text-gray-600"><span className="material-symbols-outlined text-sm">edit</span></button>
                            <button onClick={() => handleDeleteProject(project.id)} className="bg-white/90 p-1.5 rounded-full shadow-sm hover:text-red-600 text-gray-600"><span className="material-symbols-outlined text-sm">delete</span></button>
                        </div>
                        
                        {project.image ? (
                            <div className="h-32 bg-gray-100 overflow-hidden relative">
                                <img src={project.image} alt={project.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                            </div>
                        ) : (
                            <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                <span className="material-symbols-outlined text-4xl text-gray-300">image</span>
                            </div>
                        )}
                        <div className="p-4">
                            <h3 className="font-bold text-gray-900 mb-1 truncate">{project.name}</h3>
                            <p className="text-xs text-gray-500 mb-3 line-clamp-2 min-h-[2.5em]">{project.description}</p>
                            <div className="flex flex-wrap gap-1">
                                {project.techStack.slice(0, 3).map(tech => (
                                    <span key={tech} className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded">{tech}</span>
                                ))}
                                {project.techStack.length > 3 && (
                                    <span className="text-[10px] px-2 py-0.5 bg-gray-50 text-gray-500 rounded">+{project.techStack.length - 3}</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </div>
          
           {/* Education */}
           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
             <div className="flex justify-between items-center mb-4">
                 <h2 className="text-lg font-bold text-gray-900">Education</h2>
                 <button onClick={() => openModal('EDUCATION')} className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">add</span> Add
                 </button>
             </div>
             <div className="space-y-4">
                {user.education.map((edu) => (
                    <div key={edu.id} className="flex items-start gap-4 group">
                        <div className="h-12 w-12 rounded bg-gray-50 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-gray-400 text-2xl">school</span>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-gray-900">{edu.degree}</h3>
                                    <p className="text-sm text-gray-600">{edu.institution}</p>
                                    <p className="text-sm text-gray-400">{edu.year}</p>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button onClick={() => openModal('EDUCATION', edu)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><span className="material-symbols-outlined text-base">edit</span></button>
                                   <button onClick={() => handleDeleteEducation(edu.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><span className="material-symbols-outlined text-base">delete</span></button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
             </div>
          </div>

        </div>

        {/* Right Column (Sidebar) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Profile Strength */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-900">Profile Strength</h3>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${user.profileStrength}%` }}></div>
            </div>
            
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-3">
                <span className="material-symbols-outlined text-blue-600 text-sm mt-0.5">lightbulb</span>
                <p className="text-xs text-blue-800 leading-snug">
                    Add <strong>2 more skills</strong> to reach 'All-Star' status and boost visibility by 3x.
                </p>
            </div>
          </div>

          {/* Current Goal */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-gray-900">Current Goal</h3>
                <span className="material-symbols-outlined text-gray-300">flag</span>
            </div>
            
            <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <span className="material-symbols-outlined">trending_up</span>
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">Target Role</p>
                    <p className="font-bold text-gray-900">{user.targetRole}</p>
                </div>
            </div>
            
            <button 
                onClick={() => navigate('/roadmap')}
                className="w-full py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
                View Career Path
            </button>
          </div>

          {/* AI Insights */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-blue-100 p-6">
             <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-indigo-600">auto_awesome</span>
                <h3 className="font-bold text-indigo-900">AI Profile Insights</h3>
             </div>
             
             <div className="space-y-3">
                {user.insights?.map((insight, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                        <span className={`material-symbols-outlined text-sm mt-0.5 ${insight.type === 'Success' ? 'text-green-500' : 'text-amber-500'}`}>
                            {insight.type === 'Success' ? 'check_circle' : 'warning'}
                        </span>
                        <p className="text-sm text-gray-700 leading-snug">{insight.message}</p>
                    </div>
                ))}
             </div>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900">Skills</h3>
                <span onClick={() => openModal('SKILLS')} className="material-symbols-outlined text-primary cursor-pointer hover:bg-blue-50 rounded p-1">edit_square</span>
            </div>
            
            <div className="mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Expert</p>
                <div className="flex flex-wrap gap-2">
                    {user.skills.filter(s => s.level === 'Expert').map(skill => (
                        <span key={skill.name} className={`px-3 py-1 rounded-full text-xs font-medium border ${getSkillColor(skill.category)}`}>
                            {skill.name}
                        </span>
                    ))}
                </div>
            </div>
            
             <div className="mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Advanced</p>
                <div className="flex flex-wrap gap-2">
                    {user.skills.filter(s => s.level === 'Advanced').map(skill => (
                         <span key={skill.name} className={`px-3 py-1 rounded-full text-xs font-medium border ${getSkillColor(skill.category)}`}>
                            {skill.name}
                        </span>
                    ))}
                </div>
            </div>

            <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Intermediate / Beginner</p>
                <div className="flex flex-wrap gap-2">
                    {user.skills.filter(s => s.level === 'Intermediate' || s.level === 'Beginner').map(skill => (
                         <span key={skill.name} className={`px-3 py-1 rounded-full text-xs font-medium border ${getSkillColor(skill.category)}`}>
                            {skill.name}
                        </span>
                    ))}
                </div>
            </div>
          </div>

          {/* Certifications */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900">Certifications</h3>
                <button onClick={() => openModal('CERTIFICATION')} className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">add</span> Add
                </button>
            </div>
            <div className="space-y-4">
                {user.certifications.map((cert) => (
                    <div key={cert.id} className="flex items-center gap-3 group">
                        <div className="h-10 w-10 rounded-full bg-yellow-50 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-yellow-600 text-xl">verified</span>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm text-gray-900">{cert.name}</h4>
                            <p className="text-xs text-gray-500">Issued {cert.date}</p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => openModal('CERTIFICATION', cert)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><span className="material-symbols-outlined text-base">edit</span></button>
                             <button onClick={() => handleDeleteCertification(cert.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><span className="material-symbols-outlined text-base">delete</span></button>
                        </div>
                    </div>
                ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;