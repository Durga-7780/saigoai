from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from typing import List, Optional
import base64
import io
import pypdf
from datetime import datetime
from app.models.document import GeneratedDocument, DocumentCreate, DocumentType, DocumentTemplate
from app.models.employee import Employee
from app.api.routes.auth import get_current_employee as get_current_user
from app.ai.chatbot import chatbot_service

router = APIRouter()

@router.post("/generate", response_model=dict)
async def generate_document_content(
    employee_id: str = Form(...),
    type: str = Form("offer_letter"),
    custom_instructions: Optional[str] = Form(""),
    salary_breakdown: Optional[str] = Form(None), # JSON string
    template_file: Optional[UploadFile] = File(None),
    current_user: Employee = Depends(get_current_user)
):
    """
    Generate content for a document using AI.
    Only HR/Admin can do this.
    Supports optional template image (Visual) or PDF (Text Content) for generation.
    """
    if current_user.role not in ["admin", "hr", "manager"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    employee = await Employee.find_one(Employee.employee_id == employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    base64_image = None
    pdf_text_content = None

    if template_file:
        contents = await template_file.read()
        
        # Check for PDF
        if template_file.content_type == "application/pdf" or template_file.filename.lower().endswith(".pdf"):
             try:
                pdf_stream = io.BytesIO(contents)
                reader = pypdf.PdfReader(pdf_stream)
                text = ""
                for page in reader.pages:
                    text += page.extract_text() + "\n"
                pdf_text_content = text
             except Exception as e:
                 print(f"Error reading PDF: {e}")
        # Assume Image otherwise
        else:
            base64_image = base64.b64encode(contents).decode("utf-8")
    
    # Check for saved template if no file uploaded
    if not template_file and not pdf_text_content and not base64_image:
        saved_template = await DocumentTemplate.find_one(DocumentTemplate.type == type)
        if saved_template:
            pdf_text_content = saved_template.content
    
    # Fetch Company Name & Logo
    from app.models.company import CompanySettings
    company_doc = await CompanySettings.find_one()
    company_name = company_doc.name if company_doc else "My Company"
    company_logo = company_doc.logo_url if company_doc else None
    hr_signature = current_user.signature_url
        
    content = await chatbot_service.generate_official_letter(
        doc_type=type,
        employee=employee,
        custom_instructions=custom_instructions,
        base64_image=base64_image,
        pdf_text_content=pdf_text_content,
        salary_breakdown_json=salary_breakdown,
        company_name=company_name,
        company_logo=company_logo,
        hr_signature=hr_signature
    )
    
    return {"content": content}

@router.post("/template")
async def save_template(
    type: str = Form(...),
    content: str = Form(...), # The RAW text content to save
    current_user: Employee = Depends(get_current_user)
):
    """
    Save a text/PDF content as the permanent template for a document type.
    """
    if current_user.role not in ["admin", "hr", "manager"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Upsert
    existing = await DocumentTemplate.find_one(DocumentTemplate.type == type)
    if existing:
        existing.content = content
        existing.updated_at = datetime.utcnow()
        existing.updated_by = current_user.employee_id
        await existing.save()
    else:
        new_tmpl = DocumentTemplate(
            type=type,
            content=content,
            updated_by=current_user.employee_id
        )
        await new_tmpl.insert()
    
    return {"message": "Template saved successfully"}

@router.post("/", response_model=GeneratedDocument)
async def save_document(
    doc: DocumentCreate,
    current_user: Employee = Depends(get_current_user)
):
    """
    Save/Publish a generated document.
    """
    if current_user.role not in ["admin", "hr", "manager"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    document = GeneratedDocument(
        title=doc.title,
        type=doc.type,
        content=doc.content,
        employee_id=doc.employee_id,
        employee_name=doc.employee_name,
        created_by=current_user.employee_id
    )
    
    await document.insert()
    return document

@router.get("/my", response_model=List[GeneratedDocument])
async def get_my_documents(
    current_user: Employee = Depends(get_current_user)
):
    """
    Get documents for the logged-in employee.
    """
    docs = await GeneratedDocument.find(
        GeneratedDocument.employee_id == current_user.employee_id
    ).sort("-created_at").to_list()
    return docs

@router.get("/all", response_model=List[GeneratedDocument])
async def get_all_documents(
    current_user: Employee = Depends(get_current_user)
):
    """
    Get all generated documents (HR only).
    """
    if current_user.role not in ["admin", "hr", "manager"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    docs = await GeneratedDocument.find_all().sort("-created_at").to_list()
    return docs
