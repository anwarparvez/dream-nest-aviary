import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth.config";
import { connectDB } from "@/lib/db/mongodb";
import Income from "@/lib/db/models/Income";
import Project from "@/lib/db/models/Project";



export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    await connectDB();

    const IncomeModel = Income as any;

    let query = {};
    if (projectId) {
      query = { projectId };
    }

    const incomes = await IncomeModel.find(query).sort({ date: -1 }).lean();

    const formattedIncomes = incomes.map((income: any) => ({
      _id: income._id?.toString() || "",
      projectId: income.projectId?.toString() || "",
      source: income.source,
      date: income.date?.toISOString(),
      amount: income.amount,
      quantity: income.quantity,
      unitPrice: income.unitPrice,
      description: income.description || "",
      notes: income.notes || "",
      createdAt: income.createdAt?.toISOString(),
      updatedAt: income.updatedAt?.toISOString(),
    }));

    return NextResponse.json(formattedIncomes);
  } catch (error) {
    console.error("Error fetching incomes:", error);
    return NextResponse.json(
      { error: "Failed to fetch incomes" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (
      !body.projectId ||
      !body.source ||
      !body.date ||
      !body.amount ||
      !body.quantity ||
      !body.unitPrice
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    await connectDB();

    const ProjectModel = Project as any;
    const project = await ProjectModel.findById(body.projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const IncomeModel = Income as any;
    const income = await IncomeModel.create({
      projectId: body.projectId,
      source: body.source,
      date: new Date(body.date),
      amount: body.amount,
      quantity: body.quantity,
      unitPrice: body.unitPrice,
      description: body.description || "",
      notes: body.notes || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          _id: income._id.toString(),
          projectId: income.projectId.toString(),
          source: income.source,
          date: income.date.toISOString(),
          amount: income.amount,
          quantity: income.quantity,
          unitPrice: income.unitPrice,
          description: income.description,
          notes: income.notes,
          createdAt: income.createdAt.toISOString(),
          updatedAt: income.updatedAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating income:", error);
    return NextResponse.json(
      { error: "Failed to create income record" },
      { status: 500 },
    );
  }
}
